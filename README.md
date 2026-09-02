# PharmaQMS - Total Pharmaceutical Quality Management System

## نظام إدارة الجودة الشاملة للأدوية

[![React](https://img.shields.io/badge/React-19.2.0-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)]()
[![Compliance](https://img.shields.io/badge/Compliance-21%20CFR%20Part%2011-green.svg)]()
[![GMP](https://img.shields.io/badge/GMP-EU%20Annex%2011-green.svg)]()

A comprehensive, bilingual (Arabic/English) pharmaceutical quality management system built with modern web technologies.

---

## ✨ Features
[![committers.top badge](https://user-badge.committers.top/daoudtajeldeinn-png.svg)](https://committers.top/daoudtajeldeinn-png)

### 🔐 Security & Compliance (NEW)
- **Multi-Factor Authentication (MFA)**: TOTP-based MFA for privileged roles (admin, qc_manager, manager)
- **21 CFR Part 11 Compliance**: Electronic records and signatures compliance
- **EU GMP Annex 11**: Computerized system validation and compliance
- **ISPE GAMP® Guide**: Risk-based validation approach
- **Audit Trail**: Complete system activity logging with timestamps
- **Role-Based Access Control**: Granular permissions by user role
- **Soft-Delete & Recovery**: Data recovery console with audit trail
- **Data Retention**: 7-year retention policy per regulatory requirements
- **Change Control**: Integrated with Git for complete change management
- **Trial Period**: User-friendly trial with pre-filled credentials

### 🌐 Internationalization (i18n)
- **Bilingual Support**: Arabic (default) & English
- **Automatic RTL/LTR**: Direction switches based on language
- **Complete Translation**: All UI elements translated
- **Easy Switching**: One-click language toggle in header

### 📜 COA Manager (Certificate of Analysis)
- View and manage all certificates
- Professional print templates
- PDF export functionality
- Status tracking (Draft, Approved, Released)
- Search and filter capabilities
- Bilingual certificates

### 🔍 Data Recovery Console
- View and recover deleted records
- Soft-delete audit trail
- Hard delete with justification
- Role-based recovery permissions
- Search and filter deleted records
- JSON inspection for detailed analysis

### 🏭 IPQC (In-Process Quality Control)
- Stage-wise quality monitoring
- Real-time Pass/Fail indicators
- 7 production stages tracking
- Comprehensive statistics dashboard
- Detailed check records
- Performance analytics

### 📊 Dashboard & Analytics
- Real-time statistics
- Activity monitoring
- Alert system
- Trend analysis
- Custom widgets
- Compliance status indicators

### 💊 Product Management
- Complete product catalog
- Specifications management
- Raw materials tracking
- Finished products
- Excipients database

### 🧪 Testing & Analysis
- Test results management
- Multiple test methods
- OOS (Out of Specification) handling
- Pharmacopeia standards
- HPLC, Dissolution, Assay tracking

### 📝 CAPA System
- Corrective actions
- Preventive actions
- Root cause analysis
- Effectiveness verification
- Audit trail

### ⚠️ Deviation Management
- Deviation reporting
- Investigation tracking
- Impact assessment
- Resolution workflow

### 🔧 Equipment Management
- Equipment inventory
- Calibration schedules
- Maintenance records
- Qualification tracking

### 🎓 Training & Competency
- Training records
- Competency assessment
- Certification tracking
- Course management

### 🔍 Audits & Compliance
- Audit planning
- Finding management
- CAPA integration
- Compliance tracking
- IQ/OQ/PQ validation protocols
- Regulatory evidence collection

### 📊 Reports & Analytics
- Custom reports
- Automated generation
- Export capabilities
- Data visualization

### 🛡️ Quality Systems
- GMP (Good Manufacturing Practice)
- GDP (Good Distribution Practice)
- GLP (Good Laboratory Practice)
- GSP (Good Storage Practice)
- ICH Guidelines
- FDA Compliance
- ISO Standards
- Data Integrity (ALCOA+ principles)

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Modern web browser
- Internet connection (for initial setup)

### Installation

```bash
# Navigate to app directory
cd app

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production

```bash
npm run build
```

---

## 📁 Project Structure

```
PharmaQMS-Vue/
├── app/                          # Main application
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── layout/          # Layout components
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   └── LanguageSwitcher.tsx ✨
│   │   │   ├── ui/              # UI components (shadcn)
│   │   │   ├── dashboard/        # Dashboard widgets
│   │   │   ├── products/         # Product components
│   │   │   ├── testing/          # Testing components
│   │   │   └── security/         # Auth components
│   │   │       ├── SecurityProvider.tsx
│   │   │       ├── MFAEnrollment.tsx ✨ NEW
│   │   │       └── MFAChallenge.tsx ✨ NEW
│   │   ├── pages/               # Page components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Products.tsx
│   │   │   ├── Testing.tsx
│   │   │   ├── IPQC.tsx
│   │   │   ├── COAManager.tsx   ✨ NEW
│   │   │   ├── DataRecoveryConsole.tsx ✨ NEW
│   │   │   ├── CAPA.tsx
│   │   │   ├── Deviations.tsx
│   │   │   ├── Equipment.tsx
│   │   │   ├── Laboratory.tsx
│   │   │   ├── Training.tsx
│   │   │   ├── Audits.tsx
│   │   │   ├── Suppliers.tsx
│   │   │   ├── Reports.tsx
│   │   │   └── Settings.tsx
│   │   ├── hooks/               # Custom hooks
│   │   │   ├── useStore.ts
│   │   │   └── usePrintExport.tsx ✨ NEW
│   │   ├── locales/             # Translation files ✨ NEW
│   │   │   ├── ar/
│   │   │   │   └── translation.json
│   │   │   └── en/
│   │   │       └── translation.json
│   │   ├── services/            # Business services ✨ NEW
│   │   │   ├── MFAService.ts ✨ NEW
│   │   │   ├── DataRetentionService.ts ✨ NEW
│   │   │   └── ChangeControlService.ts ✨ NEW
│   │   ├── lib/                 # Utilities
│   │   ├── types/               # TypeScript types
│   │   ├── i18n.ts             ✨ NEW
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── public/                  # Static assets
│   ├── package.json
│   └── vite.config.ts
├── G2.html                      # Legacy reference
├── coq_manager_pro.py.py       # COA Manager reference
├── USER_GUIDE.md               ✨ NEW
├── QUICK_REFERENCE.md          ✨ NEW
└── README.md                   # This file

✨ = Recently added
```

---

## 🛠️ Technology Stack

### Frontend
- **React 19.2.0** - UI framework
- **TypeScript 5.9.3** - Type safety
- **Vite 7.2.4** - Build tool
- **Tailwind CSS 3.4** - Styling
- **shadcn/ui** - Component library

### Backend & Database
- **Supabase** - Backend-as-a-Service with PostgreSQL
- **Supabase Auth** - Authentication and user management
- **Supabase MFA** - Multi-factor authentication (TOTP)
- **Supabase Database** - PostgreSQL database with Row Level Security

### Security & Compliance
- **Supabase TOTP MFA** - Time-based one-time password authentication
- **Custom Security Services** - Role-based access control and audit logging
- **Data Retention Service** - Automated data lifecycle management
- **Change Control Service** - Git-integrated change management

### Internationalization
- **i18next** - Translation framework
- **react-i18next** - React integration
- **i18next-browser-languagedetector** - Auto language detection

### Internationalization
- **i18next** - Translation framework
- **react-i18next** - React integration
- **i18next-browser-languagedetector** - Auto language detection

### Printing & Export
- **jsPDF** - PDF generation
- **html2canvas** - HTML to canvas conversion
- **react-to-print** - Print functionality

### Routing & State
- **React Router DOM 7.13** - Routing
- **Custom Context** - State management

### UI Components
- **Radix UI** - Accessible components
- **Lucide React** - Icons
- **Recharts** - Charts
- **React Hook Form** - Forms
- **Zod** - Validation

---

## 📖 Documentation

- **[User Guide](USER_GUIDE.md)** - Complete user documentation (Arabic/English)
- **[Quick Reference](QUICK_REFERENCE.md)** - Quick access guide
- **[Implementation Plan](.agent/IMPLEMENTATION_PLAN.md)** - Development roadmap
- **[Progress Report](.agent/PROGRESS_REPORT.md)** - Current status
- **[GAP Implementation Summary](docs/GAP_IMPLEMENTATION_SUMMARY.md)** - Regulatory compliance implementations
- **[IQ/OQ/PQ Protocol](docs/IQ_OQ_PQ_PROTOCOL.md)** - Validation procedures (21 CFR Part 11, EU GMP Annex 11)
- **[Data Retention Policy](docs/DATA_RETENTION_POLICY_GAP10.md)** - 7-year retention policy (21 CFR Part 11)
- **[Change Control Integration](docs/CHANGE_CONTROL_SCM_INTEGRATION.md)** - SCM-integrated change control
- **[MFA Implementation](docs/MFA_IMPLEMENTATION.md)** - Multi-factor authentication documentation

---

## 🌟 Key Enhancements (September 2026)

### Recently Added Features

1. **✅ Security & Compliance Framework**
   - Multi-Factor Authentication (MFA) for privileged roles
   - 21 CFR Part 11 compliance implementation
   - EU GMP Annex 11 validation protocols
   - Soft-delete and data recovery console
   - 7-year data retention policy
   - Change control integrated with Git
   - IQ/OQ/PQ validation with 100% pass rate

2. **✅ Regulatory Compliance**
   - ISPE GAMP® Guide adherence
   - Complete audit trail system
   - Role-based access control
   - Data integrity (ALCOA+ principles)
   - Change request management
   - Validation evidence collection

3. **✅ Complete Bilingual Support**
   - Arabic (default) and English
   - RTL/LTR automatic switching
   - Comprehensive translations
   - Language switcher in header

4. **✅ COA Manager**
   - Full certificate management
   - Professional print templates
   - PDF export functionality
   - Status workflow
   - Search and filtering
   - Safe object rendering for deleted records

5. **✅ Enhanced Navigation**
   - Updated sidebar menu
   - Logical module organization
   - Visual icons for clarity
   - Breadcrumb support

6. **✅ Print & Export Infrastructure**
   - Reusable print hook
   - PDF generation utility
   - Multi-page support
   - Custom page sizes

7. **✅ Improved User Experience**
   - Responsive design
   - Touch-friendly interface
   - Loading states
   - Error handling
   - Trial period with pre-filled credentials

---

## 🎯 Upcoming Features

### Planned Enhancements

- [ ] Universal PDF export for all modules
- [ ] Advanced product templates
- [ ] Enhanced workflow visualization
- [ ] Automated notifications
- [ ] Advanced search with filters
- [ ] Data analytics dashboards
- [ ] Mobile app companion
- [ ] API integration
- [ ] Advanced reporting engine
- [ ] Blockchain for audit trail

---

## 📱 Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | Latest | ✅ Recommended |
| Edge | Latest | ✅ Supported |
| Firefox | Latest | ✅ Supported |
| Safari | Latest | ✅ Supported |

---

## 🔒 Security Features

- ✅ Multi-Factor Authentication (MFA) for privileged roles
- ✅ Role-based access control with granular permissions
- ✅ Complete audit trail for all system actions
- ✅ Soft-delete with data recovery capabilities
- ✅ 7-year data retention per regulatory requirements
- ✅ Change control integrated with Git workflow
- ✅ Data encryption at rest and in transit
- ✅ Session management with timeout
- ✅ Input validation and sanitization
- ✅ CSRF protection
- ✅ 21 CFR Part 11 compliance
- ✅ EU GMP Annex 11 compliance
- ✅ ISPE GAMP® Guide adherence

---

## 📊 System Requirements

### Minimum
- **Processor:** Dual-core 2.0 GHz
- **RAM:** 4 GB
- **Storage:** 500 MB free space
- **Browser:** Chrome 90+
- **Display:** 1366x768

### Recommended
- **Processor:** Quad-core 3.0 GHz
- **RAM:** 8 GB
- **Storage:** 2 GB free space
- **Browser:** Chrome latest
- **Display:** 1920x1080 or higher

---

## 🤝 Contributing

This is a proprietary system. For contributions or issues, contact the development team.

---

## 📞 Support

### Technical Support
- **Developer:** Dr. Daoud Tajeldeinn Ahmed
- **Email:** [Contact through system]
- **Documentation:** See USER_GUIDE.md

### For Users
- **Help Button:** Click ? in header
- **User Guide:** Comprehensive documentation available
- **Quick Reference:** QUICK_REFERENCE.md

---

## 📜 License

© 2024-2026 All Rights Reserved
Proprietary Software - Pharmaceutical Quality Management

This software is protected by copyright law and international treaties. Unauthorized reproduction or distribution may result in civil and criminal penalties.

---

## 🙏 Acknowledgments

- React Team for the amazing framework
- shadcn for beautiful UI components
- Radix UI for accessible primitives
- i18next team for internationalization
- All contributors and testers

---

## 📝 Version History

### Version 4.3.9 (September 2026) - Current
- 🔐 Implemented MFA for admin/approver roles (21 CFR Part 11 §11.300)
- 🔐 Added trial period exception for MFA
- 🔐 Implemented soft-delete and data recovery console
- 🔐 Created comprehensive data retention policy (7-year retention)
- 🔐 Integrated change control with Git workflow
- 🔐 Implemented IQ/OQ/PQ validation protocols (100% IQ pass rate)
- 🔐 Added regulatory compliance documentation
- 🔐 Enhanced security with role-based access control
- 🔐 Fixed React object rendering errors in deleted records
- 🔐 Added Git pre-commit hooks for change control
- 🔐 Created comprehensive GAP implementation summary
- 🔐 Added data retention service with lifecycle management
- 🔐 Implemented change control service with Git integration
- 🔐 Added validation evidence collection templates
- 🔐 Created automated IQ test scripts
- 🔐 Enhanced audit trail capabilities
- 🔐 Improved trial user experience with pre-filled credentials
- 🔐 Added comprehensive compliance documentation
- 🔐 Fixed various security and compliance issues
- ⚡ Performance and stability improvements

### Version 4.0 (February 2026)
- ✨ Added complete bilingual support (Arabic/English)
- ✨ Implemented COA Manager with print/PDF export
- ✨ Enhanced IPQC module
- ✨ Added language switcher
- ✨ Improved navigation structure
- ✨ Created comprehensive documentation
- 🐛 Fixed various bugs
- ⚡ Performance improvements

### Version 3.0 (January 2026)
- Initial release with core QMS functionality
- Product management
-Testing and analysis
- CAPA system
- Deviation management
- Equipment tracking

---

## 📧 Contact

**System Developer:**
Dr. Daoud Tajeldeinn Ahmed

**Organization:**
[Your Organization Name]

**Location:**
[Your Location]

---

**Made with ❤️ for Pharmaceutical Quality**

**صُنع بحب من أجل جودة الأدوية  ❤️**

---

*Last Updated: September 1, 2026*
