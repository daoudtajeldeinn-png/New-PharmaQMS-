// ICH Q1A / USP / BP Test Requirements Mapping
export const REGULATORY_TEST_TEMPLATES: Record<string, string[]> = {
    'Tablet': ['Assay', 'Dissolution', 'Related Substances', 'Water Content', 'Hardness', 'Friability'],
    'Capsule': ['Assay', 'Dissolution', 'Related Substances', 'Water Content', 'Microbial Limit'],
    'Injection': ['Assay', 'pH', 'Sterility', 'Bacterial Endotoxins', 'Related Substances', 'Particulate Matter'],
    'Syrup': ['Assay', 'pH', 'Preservative Content', 'Microbial Limit', 'Related Substances', 'Viscosity'],
    'Suspension': ['Assay', 'pH', 'Resuspendability', 'Particle Size Distribution', 'Related Substances', 'Microbial Limit'],
    'Cream': ['Assay', 'pH', 'Preservative Content', 'Microbial Limit', 'Homogeneity', 'Viscosity'],
    'Ointment': ['Assay', 'Homogeneity', 'Metal Particles', 'Microbial Limit', 'Related Substances'],
    'Inhaler': ['Assay', 'Delivered Dose Uniformity', 'Fine Particle Fraction', 'Microbial Limit', 'Leachables'],
    'Forced Degradation': ['Acid Degradation', 'Base Degradation', 'Oxidative Degradation', 'Thermal Stability', 'Photolytic Degradation'],
    'Photostability': ['Description', 'Assay', 'Related Substances', 'Color Change', 'Dissolution', 'Photolytic Degradation'],
};
