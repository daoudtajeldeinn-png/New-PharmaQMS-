/**
 * Change Control Service
 * 
 * Manages change control process integrated with Source Code Management (SCM)
 * - Change request creation and tracking
 * - Git commit linking to change requests
 * - Validation workflow management
 * - Deployment tracking and audit trail
 * - Compliance reporting
 */

import { supabase } from '../lib/supabase';

export interface ChangeRequest {
  id: string;
  title: string;
  description: string;
  change_type: 'critical' | 'major' | 'minor' | 'emergency';
  gap_reference?: string;
  status: 'draft' | 'submitted' | 'approved' | 'implemented' | 'deployed' | 'rejected';
  requested_by: string;
  created_at: string;
  updated_at: string;
  approval_level: 'development_lead' | 'qa_manager' | 'executive';
  impact_assessment: {
    affected_components: string[];
    regulatory_impact: boolean;
    data_integrity_risk: 'high' | 'medium' | 'low';
    validation_required: boolean;
    validation_level: 'iq' | 'oq' | 'pq' | 'full';
  };
  testing_plan: {
    unit_tests: string;
    integration_tests: string;
    user_acceptance: string;
  };
  deployment_plan: {
    deployment_date: string;
    rollback_plan: string;
    downtime_impact: string;
  };
  approvals: Array<{
    approver: string;
    role: string;
    status: 'pending' | 'approved' | 'rejected';
    date?: string;
    comments?: string;
  }>;
  git_integration: {
    branch_name?: string;
    commits?: string[];
    pull_request?: string;
    merge_date?: string;
  };
  validation_results?: {
    iq_status?: 'pass' | 'fail' | 'pending';
    oq_status?: 'pass' | 'fail' | 'pending';
    pq_status?: 'pass' | 'fail' | 'pending';
    deployment_status?: 'success' | 'failure' | 'pending';
  };
}

export interface ChangeRecord {
  change_request_id: string;
  change_summary: string;
  git_information: {
    branch: string;
    commits: string[];
    pull_request: string;
    merge_date: string;
  };
  validation_results: {
    iq_status: string;
    oq_status: string;
    pq_status: string;
    deployment_status: string;
  };
  post_implementation_review: {
    effectiveness: string;
    issues_encountered: string;
    lessons_learned: string;
  };
  references: {
    change_request: string;
    gap_analysis: string;
    related_documents: string[];
  };
}

export interface ValidationResult {
  is_valid: boolean;
  issues: string[];
  warnings: string[];
  recommendations: string[];
}

export interface DeploymentStatus {
  status: 'pending' | 'in_progress' | 'success' | 'failed' | 'rolled_back';
  deployment_id: string;
  timestamp: string;
  environment: 'development' | 'staging' | 'production';
  deployed_by: string;
  rollback_available: boolean;
}

class ChangeControlService {
  /**
   * Create a new change request
   */
  async createChangeRequest(data: Partial<ChangeRequest>): Promise<ChangeRequest | null> {
    try {
      const changeRequest: Partial<ChangeRequest> = {
        ...data,
        id: this.generateChangeId(),
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        approvals: this.initializeApprovals(data.change_type || 'minor'),
        git_integration: {},
      };

      const { data: result, error } = await supabase
        .from('change_requests')
        .insert(changeRequest)
        .select()
        .single();

      if (error) {
        console.error('Error creating change request:', error);
        return null;
      }

      // Log change request creation in audit trail
      await this.logChangeControlAction('change_request_created', changeRequest.id || '');

      return result as ChangeRequest;
    } catch (error) {
      console.error('Error in createChangeRequest:', error);
      return null;
    }
  }

  /**
   * Submit change request for approval
   */
  async submitChangeRequest(changeId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('change_requests')
        .update({
          status: 'submitted',
          updated_at: new Date().toISOString()
        })
        .eq('id', changeId);

      if (error) {
        console.error('Error submitting change request:', error);
        return false;
      }

      await this.logChangeControlAction('change_request_submitted', changeId);
      return true;
    } catch (error) {
      console.error('Error in submitChangeRequest:', error);
      return false;
    }
  }

  /**
   * Approve change request
   */
  async approveChangeRequest(
    changeId: string, 
    approver: string, 
    role: string, 
    comments?: string
  ): Promise<boolean> {
    try {
      const { data: changeRequest } = await supabase
        .from('change_requests')
        .select('*')
        .eq('id', changeId)
        .single();

      if (!changeRequest) {
        console.error('Change request not found');
        return false;
      }

      const approvals = changeRequest.approvals || [];
      const approvalIndex = approvals.findIndex(a => a.role === role);

      if (approvalIndex >= 0) {
        approvals[approvalIndex] = {
          ...approvals[approvalIndex],
          status: 'approved',
          approver,
          date: new Date().toISOString(),
          comments
        };
      }

      // Check if all required approvals are obtained
      const allApproved = approvals.every(a => a.status === 'approved');
      const newStatus = allApproved ? 'approved' : 'submitted';

      const { error } = await supabase
        .from('change_requests')
        .update({
          approvals,
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', changeId);

      if (error) {
        console.error('Error approving change request:', error);
        return false;
      }

      await this.logChangeControlAction('change_request_approved', changeId, 
        `Approved by ${approver} (${role})`);
      
      return true;
    } catch (error) {
      console.error('Error in approveChangeRequest:', error);
      return false;
    }
  }

  /**
   * Link Git commit to change request
   */
  async linkCommitToChange(
    commitHash: string, 
    changeId: string, 
    branchName: string
  ): Promise<boolean> {
    try {
      const { data: changeRequest } = await supabase
        .from('change_requests')
        .select('git_integration')
        .eq('id', changeId)
        .single();

      if (!changeRequest) {
        console.error('Change request not found');
        return false;
      }

      const gitIntegration = changeRequest.git_integration || {};
      const commits = gitIntegration.commits || [];
      
      // Add commit if not already linked
      if (!commits.includes(commitHash)) {
        commits.push(commitHash);
      }

      const { error } = await supabase
        .from('change_requests')
        .update({
          git_integration: {
            ...gitIntegration,
            branch_name: branchName,
            commits,
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', changeId);

      if (error) {
        console.error('Error linking commit to change request:', error);
        return false;
      }

      await this.logChangeControlAction('commit_linked', changeId, 
        `Commit ${commitHash} linked`);
      
      return true;
    } catch (error) {
      console.error('Error in linkCommitToChange:', error);
      return false;
    }
  }

  /**
   * Link pull request to change request
   */
  async linkPullRequestToChange(
    pullRequestNumber: string, 
    changeId: string
  ): Promise<boolean> {
    try {
      const { data: changeRequest } = await supabase
        .from('change_requests')
        .select('git_integration')
        .eq('id', changeId)
        .single();

      if (!changeRequest) {
        console.error('Change request not found');
        return false;
      }

      const gitIntegration = changeRequest.git_integration || {};

      const { error } = await supabase
        .from('change_requests')
        .update({
          git_integration: {
            ...gitIntegration,
            pull_request: pullRequestNumber,
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', changeId);

      if (error) {
        console.error('Error linking pull request to change request:', error);
        return false;
      }

      await this.logChangeControlAction('pull_request_linked', changeId, 
        `PR #${pullRequestNumber} linked`);
      
      return true;
    } catch (error) {
      console.error('Error in linkPullRequestToChange:', error);
      return false;
    }
  }

  /**
   * Validate change against regulatory requirements
   */
  async validateChange(changeId: string): Promise<ValidationResult> {
    try {
      const { data: changeRequest } = await supabase
        .from('change_requests')
        .select('*')
        .eq('id', changeId)
        .single();

      if (!changeRequest) {
        return {
          is_valid: false,
          issues: ['Change request not found'],
          warnings: [],
          recommendations: []
        };
      }

      const issues: string[] = [];
      const warnings: string[] = [];
      const recommendations: string[] = [];

      // Check for required approvals
      const approvals = changeRequest.approvals || [];
      const pendingApprovals = approvals.filter(a => a.status === 'pending');
      if (pendingApprovals.length > 0) {
        issues.push(`Pending approvals: ${pendingApprovals.map(a => a.role).join(', ')}`);
      }

      // Check for Git integration
      const gitIntegration = changeRequest.git_integration || {};
      if (!gitIntegration.branch_name) {
        warnings.push('No Git branch linked to change request');
      }
      if (!gitIntegration.commits || gitIntegration.commits.length === 0) {
        warnings.push('No commits linked to change request');
      }

      // Check for validation requirements
      if (changeRequest.impact_assessment?.validation_required) {
        if (!changeRequest.validation_results) {
          issues.push('Validation required but no validation results recorded');
        }
      }

      // Check for emergency changes
      if (changeRequest.change_type === 'emergency') {
        recommendations.push('Emergency change should be followed by full validation');
      }

      // Check for regulatory impact
      if (changeRequest.impact_assessment?.regulatory_impact) {
        recommendations.push('Consider regulatory notification requirements');
      }

      const isValid = issues.length === 0;

      return {
        is_valid: isValid,
        issues,
        warnings,
        recommendations
      };
    } catch (error) {
      console.error('Error in validateChange:', error);
      return {
        is_valid: false,
        issues: ['Validation process failed'],
        warnings: [],
        recommendations: []
      };
    }
  }

  /**
   * Track deployment status
   */
  async trackDeployment(
    changeId: string, 
    status: DeploymentStatus
  ): Promise<boolean> {
    try {
      const { data: changeRequest } = await supabase
        .from('change_requests')
        .select('validation_results')
        .eq('id', changeId)
        .single();

      if (!changeRequest) {
        console.error('Change request not found');
        return false;
      }

      const validationResults = changeRequest.validation_results || {};
      validationResults.deployment_status = status.status;

      const newStatus = status.status === 'success' ? 'deployed' : 
                       status.status === 'failed' ? 'implemented' : changeRequest.status;

      const { error } = await supabase
        .from('change_requests')
        .update({
          validation_results: validationResults,
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', changeId);

      if (error) {
        console.error('Error tracking deployment:', error);
        return false;
      }

      await this.logChangeControlAction('deployment_tracked', changeId, 
        `Deployment ${status.status} in ${status.environment}`);
      
      return true;
    } catch (error) {
      console.error('Error in trackDeployment:', error);
      return false;
    }
  }

  /**
   * Generate change control report
   */
  async generateChangeReport(changeId: string): Promise<ChangeRecord | null> {
    try {
      const { data: changeRequest } = await supabase
        .from('change_requests')
        .select('*')
        .eq('id', changeId)
        .single();

      if (!changeRequest) {
        console.error('Change request not found');
        return null;
      }

      const changeRecord: ChangeRecord = {
        change_request_id: changeId,
        change_summary: changeRequest.description,
        git_information: {
          branch: changeRequest.git_integration?.branch_name || 'unknown',
          commits: changeRequest.git_integration?.commits || [],
          pull_request: changeRequest.git_integration?.pull_request || 'unknown',
          merge_date: changeRequest.git_integration?.merge_date || new Date().toISOString()
        },
        validation_results: {
          iq_status: changeRequest.validation_results?.iq_status || 'pending',
          oq_status: changeRequest.validation_results?.oq_status || 'pending',
          pq_status: changeRequest.validation_results?.pq_status || 'pending',
          deployment_status: changeRequest.validation_results?.deployment_status || 'pending'
        },
        post_implementation_review: {
          effectiveness: 'To be completed',
          issues_encountered: 'None',
          lessons_learned: 'To be documented'
        },
        references: {
          change_request: changeId,
          gap_analysis: changeRequest.gap_reference || 'N/A',
          related_documents: []
        }
      };

      return changeRecord;
    } catch (error) {
      console.error('Error in generateChangeReport:', error);
      return null;
    }
  }

  /**
   * Get change request by ID
   */
  async getChangeRequest(changeId: string): Promise<ChangeRequest | null> {
    try {
      const { data, error } = await supabase
        .from('change_requests')
        .select('*')
        .eq('id', changeId)
        .single();

      if (error) {
        console.error('Error fetching change request:', error);
        return null;
      }

      return data as ChangeRequest;
    } catch (error) {
      console.error('Error in getChangeRequest:', error);
      return null;
    }
  }

  /**
   * Get all change requests
   */
  async getAllChangeRequests(filters?: {
    status?: string;
    change_type?: string;
    requested_by?: string;
  }): Promise<ChangeRequest[]> {
    try {
      let query = supabase.from('change_requests').select('*');

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.change_type) {
        query = query.eq('change_type', filters.change_type);
      }
      if (filters?.requested_by) {
        query = query.eq('requested_by', filters.requested_by);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching change requests:', error);
        return [];
      }

      return data as ChangeRequest[];
    } catch (error) {
      console.error('Error in getAllChangeRequests:', error);
      return [];
    }
  }

  /**
   * Generate change ID
   */
  private generateChangeId(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `CR-${timestamp}-${random}`;
  }

  /**
   * Initialize approvals based on change type
   */
  private initializeApprovals(changeType: string): Array<{
    approver: string;
    role: string;
    status: 'pending' | 'approved' | 'rejected';
  }> {
    const approvals: Array<{
      approver: string;
      role: string;
      status: 'pending' | 'approved' | 'rejected';
    }> = [];

    // Development lead approval for all changes
    approvals.push({
      approver: '',
      role: 'development_lead',
      status: 'pending'
    });

    // QA manager approval for major and critical changes
    if (changeType === 'major' || changeType === 'critical') {
      approvals.push({
        approver: '',
        role: 'qa_manager',
        status: 'pending'
      });
    }

    // Executive approval for critical and emergency changes
    if (changeType === 'critical' || changeType === 'emergency') {
      approvals.push({
        approver: '',
        role: 'executive',
        status: 'pending'
      });
    }

    return approvals;
  }

  /**
   * Log change control action in audit trail
   */
  private async logChangeControlAction(
    action: string, 
    changeId: string, 
    details?: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          action: `change_control_${action}`,
          table_name: 'change_requests',
          record_id: changeId,
          details: details || `Change ID: ${changeId}`,
          timestamp: new Date().toISOString(),
          user_id: 'system', // System action
          ip_address: 'localhost'
        });

      if (error) {
        console.error('Error logging change control action:', error);
      }
    } catch (error) {
      console.error('Error in logChangeControlAction:', error);
    }
  }

  /**
   * Update change request status
   */
  async updateChangeRequestStatus(
    changeId: string, 
    status: ChangeRequest['status']
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('change_requests')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', changeId);

      if (error) {
        console.error('Error updating change request status:', error);
        return false;
      }

      await this.logChangeControlAction('status_updated', changeId, 
        `Status changed to ${status}`);
      
      return true;
    } catch (error) {
      console.error('Error in updateChangeRequestStatus:', error);
      return false;
    }
  }

  /**
   * Get change control metrics
   */
  async getChangeControlMetrics(): Promise<{
    total_requests: number;
    by_status: Record<string, number>;
    by_type: Record<string, number>;
    avg_cycle_time: number;
    success_rate: number;
  }> {
    try {
      const { data: changeRequests } = await supabase
        .from('change_requests')
        .select('*');

      if (!changeRequests) {
        return {
          total_requests: 0,
          by_status: {},
          by_type: {},
          avg_cycle_time: 0,
          success_rate: 0
        };
      }

      const totalRequests = changeRequests.length;
      const byStatus: Record<string, number> = {};
      const byType: Record<string, number> = {};

      let totalCycleTime = 0;
      let completedRequests = 0;
      let successfulDeployments = 0;

      changeRequests.forEach((cr: any) => {
        // Count by status
        byStatus[cr.status] = (byStatus[cr.status] || 0) + 1;
        
        // Count by type
        byType[cr.change_type] = (byType[cr.change_type] || 0) + 1;
        
        // Calculate cycle time for completed requests
        if (cr.status === 'deployed') {
          const created = new Date(cr.created_at).getTime();
          const updated = new Date(cr.updated_at).getTime();
          const cycleTime = (updated - created) / (1000 * 60 * 60 * 24); // days
          totalCycleTime += cycleTime;
          completedRequests++;
          successfulDeployments++;
        }
      });

      const avgCycleTime = completedRequests > 0 ? totalCycleTime / completedRequests : 0;
      const successRate = totalRequests > 0 ? (successfulDeployments / totalRequests) * 100 : 0;

      return {
        total_requests: totalRequests,
        by_status: byStatus,
        by_type: byType,
        avg_cycle_time: avgCycleTime,
        success_rate: successRate
      };
    } catch (error) {
      console.error('Error in getChangeControlMetrics:', error);
      return {
        total_requests: 0,
        by_status: {},
        by_type: {},
        avg_cycle_time: 0,
        success_rate: 0
      };
    }
  }
}

export const changeControlService = new ChangeControlService();