import Swal from "sweetalert2";

// Utility to get consistent theme-aware configuration
const getTacticalConfig = () => ({
  background: "oklch(var(--b1))",
  color: "oklch(var(--bc))",
  backdrop: "rgba(0, 0, 0, 0.4)",
  customClass: {
    container: "backdrop-blur-sm", 
    popup: "bg-base-100 border border-base-content/10 rounded-sm shadow-2xl overflow-hidden",
    title: "font-heading text-xl md:text-2xl font-black uppercase tracking-tighter text-base-content pt-10",
    htmlContainer: "text-[11px] font-bold uppercase tracking-[0.15em] text-base-content/60 leading-relaxed pb-4",
    confirmButton: "bg-base-content text-base-100 px-10 py-4 rounded-full font-heading font-black uppercase tracking-[0.3em] text-[10px] hover:bg-accent hover:text-white active:scale-95 transition-all mx-2 shadow-lg cursor-pointer outline-none select-none",
    cancelButton: "bg-base-200 text-base-content px-10 py-4 rounded-full font-heading font-black uppercase tracking-[0.3em] text-[10px] hover:bg-red-600 hover:text-white active:scale-95 transition-all mx-2 shadow-md cursor-pointer outline-none select-none",
    actions: "pb-10 gap-2",
    loader: "border-accent",
    icon: "mt-10 border-base-content/10",
  },
  buttonsStyling: false,
  // Use default Swal animations for maximum reliability
  showClass: {
    popup: "swal2-show",
    backdrop: "swal2-backdrop-show",
    icon: "swal2-icon-show"
  },
  hideClass: {
    popup: "swal2-hide",
    backdrop: "swal2-backdrop-hide",
    icon: "swal2-icon-hide"
  },
  width: "32rem",
  focusConfirm: true,
  allowOutsideClick: false,
  // Ensure the popup doesn't interfere with the body's pointer events
  scrollbarPadding: false,
});

// 1. Processing Alert
export const showProcessing = (
  title = "Processing...",
  text = "Please wait...",
) => {
  return Swal.fire({
    ...getTacticalConfig(),
    title,
    text,
    didOpen: () => {
      Swal.showLoading();
    },
  });
};

// 2. Error Alert
export const showError = (title = "Error.", text = "Error.") => {
  return Swal.fire({
    ...getTacticalConfig(),
    icon: "error",
    iconColor: "#ef4444",
    title,
    text,
  });
};

// 3. Success Alert
export const showSuccess = (title = "Successful.", text = "") => {
  return Swal.fire({
    ...getTacticalConfig(),
    icon: "success",
    iconColor: "#22c55e",
    title,
    text,
  });
};

// 4. Confirmation Alert
export const showConfirmation = async (
  title = "Are you sure?",
  text = "If sure please click on Ok.",
  confirmButtonText = "Ok",
  cancelButtonText = "Cancel",
) => {
  return Swal.fire({
    ...getTacticalConfig(),
    title,
    text,
    icon: "warning",
    iconColor: "#eab308",
    showCancelButton: true,
    cancelButtonText,
    confirmButtonText,
  });
};

// 5. Close Alert
export const closeAlert = () => {
  Swal.close();
};
