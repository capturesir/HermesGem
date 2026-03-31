// Permission definitions for each role
const PERMISSIONS = {
  admin: {
    users: { view: true, create: true, edit: true, delete: true },
    patients: { view: true, create: true, edit: true, delete: true },
    appointments: { view: true, create: true, edit: true, delete: true },
    settings: { view: true, create: true, edit: true, delete: true },
    soap: { view: true, create: true, edit: true, delete: true },
    prescriptions: { view: true, create: true, edit: true, delete: true },
    vitals: { view: true, create: true, edit: true, delete: true },
    allergies: { view: true, create: true, edit: true, delete: true },
    alerts: { view: true, create: true, edit: true, delete: true },
    documents: { view: true, create: true, edit: true, delete: true },
    statistics: { view: true, create: false, edit: false, delete: false },
    audit_logs: { view: true, create: false, edit: false, delete: false },
    print_labels: { view: true, create: false, edit: false, delete: false }
  },
  staff: {
    users: { view: false, create: false, edit: false, delete: false },
    patients: { view: true, create: false, edit: false, delete: false },
    appointments: { view: true, create: true, edit: true, delete: false },
    settings: { view: false, create: false, edit: false, delete: false },
    soap: { view: false, create: false, edit: false, delete: false },
    prescriptions: { view: false, create: false, edit: false, delete: false },
    vitals: { view: false, create: false, edit: false, delete: false },
    allergies: { view: false, create: false, edit: false, delete: false },
    alerts: { view: false, create: false, edit: false, delete: false },
    documents: { view: true, create: true, edit: false, delete: false },
    statistics: { view: true, create: false, edit: false, delete: false },
    audit_logs: { view: false, create: false, edit: false, delete: false },
    print_labels: { view: true, create: false, edit: false, delete: false }
  },
  doctor: {
    users: { view: false, create: false, edit: false, delete: false },
    patients: { view: true, create: true, edit: true, delete: false },
    appointments: { view: true, create: false, edit: true, delete: false },
    settings: { view: false, create: false, edit: false, delete: false },
    soap: { view: true, create: true, edit: true, delete: true },
    prescriptions: { view: true, create: true, edit: true, delete: true },
    vitals: { view: true, create: false, edit: false, delete: false },
    allergies: { view: true, create: true, edit: true, delete: false },
    alerts: { view: true, create: true, edit: true, delete: false },
    documents: { view: true, create: true, edit: true, delete: false },
    statistics: { view: true, create: false, edit: false, delete: false },
    audit_logs: { view: false, create: false, edit: false, delete: false },
    print_labels: { view: true, create: false, edit: false, delete: false }
  },
  nurse: {
    users: { view: false, create: false, edit: false, delete: false },
    patients: { view: true, create: false, edit: false, delete: false },
    appointments: { view: true, create: false, edit: false, delete: false },
    settings: { view: false, create: false, edit: false, delete: false },
    soap: { view: true, create: false, edit: false, delete: false },
    prescriptions: { view: true, create: false, edit: false, delete: false },
    vitals: { view: true, create: true, edit: true, delete: false },
    allergies: { view: true, create: true, edit: true, delete: false },
    alerts: { view: true, create: true, edit: true, delete: false },
    documents: { view: true, create: true, edit: true, delete: false },
    statistics: { view: true, create: false, edit: false, delete: false },
    audit_logs: { view: false, create: false, edit: false, delete: false },
    print_labels: { view: true, create: false, edit: false, delete: false }
  },
  patient: {
    users: { view: false, create: false, edit: false, delete: false },
    patients: { view: true, create: false, edit: false, delete: false },
    appointments: { view: true, create: true, edit: false, delete: false },
    settings: { view: false, create: false, edit: false, delete: false },
    soap: { view: true, create: false, edit: false, delete: false },
    prescriptions: { view: true, create: false, edit: false, delete: false },
    vitals: { view: true, create: false, edit: false, delete: false },
    allergies: { view: true, create: false, edit: false, delete: false },
    alerts: { view: true, create: false, edit: false, delete: false },
    documents: { view: true, create: true, edit: false, delete: false },
    statistics: { view: true, create: false, edit: false, delete: false },
    audit_logs: { view: false, create: false, edit: false, delete: false },
    print_labels: { view: true, create: false, edit: false, delete: false }
  }
};

// Default edit time limit for SOAP notes (in hours)
const DEFAULT_SOAP_EDIT_HOURS = 48;

module.exports = { PERMISSIONS, DEFAULT_SOAP_EDIT_HOURS };
