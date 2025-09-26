"use client";

import React, { useCallback, useMemo, useState, useRef } from "react";
import {
  useDebouncedSearch,
  useOptimizedEventHandlers,
} from "@/hooks/useSimplePerformance";

interface FormField {
  name: string;
  type:
    | "text"
    | "email"
    | "password"
    | "number"
    | "select"
    | "textarea"
    | "checkbox"
    | "radio";
  label: string;
  placeholder?: string;
  required?: boolean;
  validation?: (value: any) => string | null;
  options?: Array<{ value: string | number; label: string }>;
  disabled?: boolean;
  className?: string;
  rows?: number; // for textarea
}

interface OptimizedFormProps {
  fields: FormField[];
  initialValues?: Record<string, any>;
  onSubmit: (values: Record<string, any>) => Promise<void> | void;
  onChange?: (values: Record<string, any>) => void;
  className?: string;
  submitButtonText?: string;
  submitButtonClassName?: string;
  validationDelay?: number;
  showValidationOnChange?: boolean;
  disabled?: boolean;
  loading?: boolean;
}

interface FormErrors {
  [key: string]: string | null;
}

const OptimizedForm: React.FC<OptimizedFormProps> = ({
  fields,
  initialValues = {},
  onSubmit,
  onChange,
  className = "",
  submitButtonText = "Submit",
  submitButtonClassName = "",
  validationDelay = 300,
  showValidationOnChange = true,
  disabled = false,
  loading = false,
}) => {
  const [values, setValues] = useState<Record<string, any>>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);
  const { createHandler, createDebouncedHandler } = useOptimizedEventHandlers();

  // Memoized validation function
  const validateField = useMemo(() => {
    return (fieldName: string, value: any): string | null => {
      const field = fields.find((f) => f.name === fieldName);
      if (!field) return null;

      // Required validation
      if (
        field.required &&
        (!value || (typeof value === "string" && value.trim() === ""))
      ) {
        return `${field.label} is required`;
      }

      // Custom validation
      if (field.validation && value) {
        return field.validation(value);
      }

      // Built-in validations
      if (field.type === "email" && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return "Please enter a valid email address";
        }
      }

      return null;
    };
  }, [fields]);

  // Debounced validation
  const { handleSearch: debouncedValidate } = useDebouncedSearch(
    useCallback(
      (fieldName: string) => {
        const value = values[fieldName];
        const error = validateField(fieldName, value);
        setErrors((prev) => ({ ...prev, [fieldName]: error }));
      },
      [values, validateField]
    ),
    validationDelay
  );

  // Validate all fields
  const validateAllFields = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    fields.forEach((field) => {
      const error = validateField(field.name, values[field.name]);
      newErrors[field.name] = error;
      if (error) isValid = false;
    });

    setErrors(newErrors);
    return isValid;
  }, [fields, values, validateField]);

  // Handle field change
  const handleFieldChange = createHandler(
    "fieldChange",
    (fieldName: string, value: any) => {
      const newValues = { ...values, [fieldName]: value };
      setValues(newValues);
      onChange?.(newValues);

      // Mark field as touched
      setTouched((prev) => ({ ...prev, [fieldName]: true }));

      // Debounced validation
      if (showValidationOnChange) {
        debouncedValidate(fieldName);
      }
    }
  );

  // Handle field blur
  const handleFieldBlur = createHandler("fieldBlur", (fieldName: string) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));

    // Immediate validation on blur
    const error = validateField(fieldName, values[fieldName]);
    setErrors((prev) => ({ ...prev, [fieldName]: error }));
  });

  // Handle form submission
  const handleSubmit = createHandler(
    "formSubmit",
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (disabled || loading || isSubmitting) return;

      // Validate all fields
      const isValid = validateAllFields();
      if (!isValid) return;

      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } catch (error) {
        console.error("Form submission error:", error);
      } finally {
        setIsSubmitting(false);
      }
    }
  );

  // Render field based on type
  const renderField = useCallback(
    (field: FormField) => {
      const value = values[field.name] || "";
      const error = errors[field.name];
      const isTouched = touched[field.name];
      const showError = isTouched && error;

      const baseInputClasses = `
      w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 
      ${showError ? "border-red-500" : "border-gray-300"}
      ${
        field.disabled || disabled
          ? "bg-gray-100 cursor-not-allowed"
          : "bg-white"
      }
      ${field.className || ""}
    `;

      const fieldId = `field-${field.name}`;

      switch (field.type) {
        case "select":
          return (
            <select
              id={fieldId}
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              onBlur={() => handleFieldBlur(field.name)}
              disabled={field.disabled || disabled}
              className={baseInputClasses}
              required={field.required}
            >
              <option value="">
                {field.placeholder || `Select ${field.label}`}
              </option>
              {field.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          );

        case "textarea":
          return (
            <textarea
              id={fieldId}
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              onBlur={() => handleFieldBlur(field.name)}
              placeholder={field.placeholder}
              disabled={field.disabled || disabled}
              rows={field.rows || 3}
              className={baseInputClasses}
              required={field.required}
            />
          );

        case "checkbox":
          return (
            <div className="flex items-center">
              <input
                id={fieldId}
                type="checkbox"
                checked={Boolean(value)}
                onChange={(e) =>
                  handleFieldChange(field.name, e.target.checked)
                }
                onBlur={() => handleFieldBlur(field.name)}
                disabled={field.disabled || disabled}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                required={field.required}
              />
              <label
                htmlFor={fieldId}
                className="ml-2 block text-sm text-gray-900"
              >
                {field.label}
              </label>
            </div>
          );

        case "radio":
          return (
            <div className="space-y-2">
              {field.options?.map((option) => (
                <div key={option.value} className="flex items-center">
                  <input
                    id={`${fieldId}-${option.value}`}
                    type="radio"
                    name={field.name}
                    value={option.value}
                    checked={value === option.value}
                    onChange={(e) =>
                      handleFieldChange(field.name, e.target.value)
                    }
                    onBlur={() => handleFieldBlur(field.name)}
                    disabled={field.disabled || disabled}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    required={field.required}
                  />
                  <label
                    htmlFor={`${fieldId}-${option.value}`}
                    className="ml-2 block text-sm text-gray-900"
                  >
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          );

        default:
          return (
            <input
              id={fieldId}
              type={field.type}
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              onBlur={() => handleFieldBlur(field.name)}
              placeholder={field.placeholder}
              disabled={field.disabled || disabled}
              className={baseInputClasses}
              required={field.required}
            />
          );
      }
    },
    [values, errors, touched, disabled, handleFieldChange, handleFieldBlur]
  );

  // Check if form has errors
  const hasErrors = useMemo(() => {
    return Object.values(errors).some((error) => error !== null);
  }, [errors]);

  // Check if form is valid for submission
  const isFormValid = useMemo(() => {
    return (
      !hasErrors &&
      fields.every((field) => {
        if (!field.required) return true;
        const value = values[field.name];
        return value && (typeof value !== "string" || value.trim() !== "");
      })
    );
  }, [hasErrors, fields, values]);

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className={`space-y-6 ${className}`}
      noValidate
    >
      {fields.map((field) => {
        const error = errors[field.name];
        const isTouched = touched[field.name];
        const showError = isTouched && error;

        return (
          <div key={field.name} className="space-y-1">
            {field.type !== "checkbox" && (
              <label
                htmlFor={`field-${field.name}`}
                className="block text-sm font-medium text-gray-700"
              >
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
            )}

            {renderField(field)}

            {showError && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
          </div>
        );
      })}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={disabled || loading || isSubmitting || !isFormValid}
          className={`
            px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors duration-200
            ${submitButtonClassName}
          `}
        >
          {isSubmitting || loading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Submitting...</span>
            </div>
          ) : (
            submitButtonText
          )}
        </button>
      </div>
    </form>
  );
};

export default React.memo(OptimizedForm);
