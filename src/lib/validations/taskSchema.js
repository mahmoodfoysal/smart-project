/**
 * Validates a single task's form data against defensive business rules.
 * Returns an object of errors, keyed by field name.
 */
export const validateTaskSchema = (formData, projectTasks = [], selectedTask = null) => {
  const errors = {};

  // Basic required fields
  if (!formData.title || !formData.title.trim()) {
    errors.title = "Task Title is required.";
  }
  if (!formData.assigned_member) {
    errors.assigned_member = "Assigned Member is required.";
  }

  // Guard A: No Duplicate Task Titles
  // Prevent users from creating a task title that already exists in this project
  if (formData.title && formData.title.trim()) {
    const isDuplicate = projectTasks.some((t) => {
      // If we are editing, ignore self
      const isSelf = selectedTask && (t.id || t._id) === (selectedTask.id || selectedTask._id);
      if (isSelf) return false;
      return t.title.toLowerCase() === formData.title.trim().toLowerCase();
    });

    if (isDuplicate) {
      errors.title = "This task already exists in the project.";
    }
  }

  // Guard B: Frozen Reassignment on Completed Tasks
  // If the task is Completed, users cannot re-assign it to someone else.
  if (selectedTask && selectedTask.status === "Completed" && formData.status === "Completed") {
    if (formData.assigned_member !== selectedTask.assigned_member) {
      errors.assigned_member = "Completed tasks cannot be reassigned.";
    }
  }

  // Guard C: Chronological Safeguard (No Past Deadlines)
  // Ensure the selected deadline is not in the past
  if (formData.due_date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // reset time to midnight for accurate day comparison
    const selectedDate = new Date(formData.due_date);
    if (selectedDate < today) {
      errors.due_date = "Please select a valid deadline (cannot be in the past).";
    }
  }

  return errors;
};
