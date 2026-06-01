"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Search, Users, Loader2, X, Download, FileSpreadsheet } from "lucide-react";
import {
  NeuTable,
  NeuTableHeader,
  NeuTableBody,
  NeuTableRow,
  NeuTableHead,
  NeuTableCell,
} from "@/components/ui/neu-table";
import { NeuCard, NeuCardHeader, NeuCardTitle, NeuCardContent } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";
import { NeuInput } from "@/components/ui/neu-input";
import { NeuSelect } from "@/components/ui/neu-select";
import { NeuDialog } from "@/components/ui/neu-dialog";
import { NeuBadge } from "@/components/ui/neu-badge";
import { List2, ListItem } from "@/components/ui/list-2";
import { User as UserIcon } from "lucide-react";
import { useTranslations } from "next-intl";

interface Employee {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "employee";
  employeeId?: string;
  department?: { _id: string; name: string } | null;
  shift?: { _id: string; name: string } | null;
  salary?: number;
  joiningDate?: string;
  isActive?: boolean;
  createdAt: string;
}

interface EmployeeFormData {
  name: string;
  email: string;
  password: string;
  role: "admin" | "employee";
  department: string;
  shift: string;
  salary: string;
  joiningDate: string;
}

interface Department {
  _id: string;
  name: string;
}

interface Shift {
  _id: string;
  name: string;
}

const emptyFormData: EmployeeFormData = {
  name: "",
  email: "",
  password: "",
  role: "employee",
  department: "",
  shift: "",
  salary: "",
  joiningDate: "",
};

export default function EmployeeManagementPage() {
  const t = useTranslations("admin.employees");
  const tc = useTranslations("admin.common");

  const roleOptions = [
    { value: "employee", label: "Employee" },
    { value: "admin", label: "Admin" },
  ];

  const departmentOptions = [
    { value: "", label: t("addDialog.departmentPlaceholder") },
    { value: "Engineering", label: "Engineering" },
    { value: "Design", label: "Design" },
    { value: "Marketing", label: "Marketing" },
    { value: "Sales", label: "Sales" },
    { value: "HR", label: "HR" },
    { value: "Finance", label: "Finance" },
    { value: "Operations", label: "Operations" },
  ];

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const [formData, setFormData] = useState<EmployeeFormData>(emptyFormData);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof EmployeeFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchEmployees = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/employees");
      const data = await response.json();
      if (data.success) {
        setEmployees(data.data);
        setFilteredEmployees(data.data);
      } else {
        setError(data.error || "Failed to fetch employees");
      }
    } catch (err) {
      setError("Failed to fetch employees");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredEmployees(employees);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = employees.filter(
      (emp) =>
        emp.name.toLowerCase().includes(query) ||
        emp.email.toLowerCase().includes(query) ||
        emp.employeeId?.toLowerCase().includes(query) ||
        emp.department?.name?.toLowerCase().includes(query)
    );
    setFilteredEmployees(filtered);
  }, [searchQuery, employees]);

  const validateForm = (isEdit: boolean): boolean => {
    const errors: Partial<Record<keyof EmployeeFormData, string>> = {};

    if (!formData.name.trim()) {
      errors.name = t("validation.nameRequired");
    }

    if (!formData.email.trim()) {
      errors.email = t("validation.emailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = t("validation.emailInvalid");
    }

    if (!isEdit && !formData.password) {
      errors.password = t("validation.passwordRequired");
    } else if (!isEdit && formData.password.length < 6) {
      errors.password = t("validation.passwordMinLength");
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAdd = async () => {
    if (!validateForm(false)) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        setIsAddDialogOpen(false);
        setFormData(emptyFormData);
        fetchEmployees();
      } else {
        setFormErrors({ ...formErrors, email: data.error });
      }
    } catch (err) {
      console.error(err);
      setError("Failed to add employee");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedEmployee || !validateForm(true)) return;

    setIsSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        id: selectedEmployee._id,
        name: formData.name,
        email: formData.email,
        role: formData.role,
        department: formData.department,
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      const response = await fetch("/api/employees", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        setIsEditDialogOpen(false);
        setSelectedEmployee(null);
        setFormData(emptyFormData);
        fetchEmployees();
      } else {
        setFormErrors({ ...formErrors, email: data.error });
      }
    } catch (err) {
      console.error(err);
      setError("Failed to update employee");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedEmployee) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/employees?id=${selectedEmployee._id}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (data.success) {
        setIsDeleteDialogOpen(false);
        setSelectedEmployee(null);
        fetchEmployees();
      } else {
        setError(data.error || "Failed to delete employee");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to delete employee");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormData({
      name: employee.name,
      email: employee.email,
      password: "",
      role: employee.role,
      department: employee.department?._id || "",
      shift: employee.shift?._id || "",
      salary: employee.salary?.toString() || "",
      joiningDate: employee.joiningDate ? new Date(employee.joiningDate).toISOString().split('T')[0] : "",
    });
    setFormErrors({});
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsDeleteDialogOpen(true);
  };

  const openAddDialog = () => {
    setFormData(emptyFormData);
    setFormErrors({});
    setIsAddDialogOpen(true);
  };

  const getRoleBadgeVariant = (role: string): "accent" | "default" => {
    return role === "admin" ? "accent" : "default";
  };

  const handleExportEmployees = async () => {
    try {
      const response = await fetch("/api/export/employees?format=excel");

      if (!response.ok) {
        throw new Error("Failed to export");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = "employees-export.xlsx";
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) filename = match[1];
      }

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export employees error:", error);
      alert("Failed to export employees. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--neu-accent)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--neu-danger)] text-lg">{error}</p>
        <NeuButton variant="accent" onClick={fetchEmployees} className="mt-4">
          {tc("retry")}
        </NeuButton>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 md:w-8 md:h-8 text-[var(--neu-accent)]" />
          <h1 className="text-xl md:text-2xl font-bold text-[var(--neu-text)]">
            {t("title")}
          </h1>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <NeuButton
            variant="ghost"
            onClick={handleExportEmployees}
            className="flex-1 sm:flex-none h-11"
          >
            <FileSpreadsheet className="w-4 h-4" />
            {t("exportExcel")}
          </NeuButton>
          <NeuButton
            variant="accent"
            onClick={openAddDialog}
            className="flex-1 sm:flex-none h-11 shadow-[0_0_20px_-5px_var(--neu-accent)]"
          >
            <Plus className="w-4 h-4" />
            {t("addEmployee")}
          </NeuButton>
        </div>
      </div>

      {/* Search */}
      <NeuInput
        type="text"
        placeholder={t("searchPlaceholder")}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        icon={<Search className="w-4 h-4" />}
      />

      {/* Employees Table */}
      <NeuCard>
        <NeuCardHeader>
          <NeuCardTitle>{t("tableTitle", { count: filteredEmployees.length })}</NeuCardTitle>
        </NeuCardHeader>
        <NeuCardContent>
          {filteredEmployees.length === 0 ? (
            <div className="text-center py-12 text-[var(--neu-text-secondary)]">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">{t("noEmployees")}</p>
              <p className="text-sm mt-1">
                {searchQuery ? t("adjustSearch") : t("addFirst")}
              </p>
            </div>
          ) : (
            <List2
              items={filteredEmployees.map((employee) => ({
                icon: <UserIcon className="w-5 h-5" />,
                title: employee.name,
                category: employee.role.toUpperCase(),
                description: `${employee.department?.name || 'No Dept'} • ${employee.email}`,
                onClick: () => openEditDialog(employee),
                status: (
                  <div className="flex items-center gap-2">
                    <NeuBadge variant={getRoleBadgeVariant(employee.role)}>
                      {employee.role}
                    </NeuBadge>
                    <NeuButton
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeleteDialog(employee);
                      }}
                      className="h-8 w-8 text-[var(--neu-danger)] hover:bg-[var(--neu-danger)]/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </NeuButton>
                  </div>
                )
              }))}
            />
          )}
        </NeuCardContent>
      </NeuCard>

      {/* Add Employee Dialog */}
      <NeuDialog
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        title={t("addDialog.title")}
      >
        <div className="space-y-4">
          <NeuInput
            label={t("addDialog.fullName")}
            placeholder={t("addDialog.fullNamePlaceholder")}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={formErrors.name}
          />
          <NeuInput
            label={t("addDialog.email")}
            type="email"
            placeholder={t("addDialog.emailPlaceholder")}
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={formErrors.email}
          />
          <NeuInput
            label={t("addDialog.password")}
            type="password"
            placeholder={t("addDialog.passwordPlaceholder")}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            error={formErrors.password}
          />
          <NeuSelect
            label={t("addDialog.role")}
            options={roleOptions}
            value={formData.role}
            onChange={(e) =>
              setFormData({ ...formData, role: e.target.value as "admin" | "employee" })
            }
          />
          <NeuSelect
            label={t("addDialog.department")}
            options={departmentOptions}
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            placeholder={t("addDialog.departmentPlaceholder")}
          />
          <div className="flex gap-3 pt-4">
            <NeuButton
              variant="accent"
              onClick={handleAdd}
              loading={isSubmitting}
              className="flex-1"
            >
              {t("addDialog.submit")}
            </NeuButton>
            <NeuButton
              variant="ghost"
              onClick={() => setIsAddDialogOpen(false)}
              disabled={isSubmitting}
            >
              {tc("cancel")}
            </NeuButton>
          </div>
        </div>
      </NeuDialog>

      {/* Edit Employee Dialog */}
      <NeuDialog
        open={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        title={t("editDialog.title")}
      >
        <div className="space-y-4">
          <NeuInput
            label={t("addDialog.fullName")}
            placeholder={t("addDialog.fullNamePlaceholder")}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={formErrors.name}
          />
          <NeuInput
            label={t("addDialog.email")}
            type="email"
            placeholder={t("addDialog.emailPlaceholder")}
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={formErrors.email}
          />
          <NeuInput
            label={t("editDialog.passwordLabel")}
            type="password"
            placeholder={t("editDialog.passwordPlaceholder")}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            error={formErrors.password}
          />
          <NeuSelect
            label={t("addDialog.role")}
            options={roleOptions}
            value={formData.role}
            onChange={(e) =>
              setFormData({ ...formData, role: e.target.value as "admin" | "employee" })
            }
          />
          <NeuSelect
            label={t("addDialog.department")}
            options={departmentOptions}
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            placeholder={t("addDialog.departmentPlaceholder")}
          />
          <div className="flex gap-3 pt-4">
            <NeuButton
              variant="accent"
              onClick={handleEdit}
              loading={isSubmitting}
              className="flex-1"
            >
              {t("editDialog.saveChanges")}
            </NeuButton>
            <NeuButton
              variant="ghost"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isSubmitting}
            >
              {tc("cancel")}
            </NeuButton>
          </div>
        </div>
      </NeuDialog>

      {/* Delete Confirmation Dialog */}
      <NeuDialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        title={t("deleteDialog.title")}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-[var(--neu-danger)]/10 rounded-[var(--neu-radius)]">
            <Trash2 className="w-6 h-6 text-[var(--neu-danger)]" />
            <div>
              <p className="text-[var(--neu-text)] font-medium">
                {t("deleteDialog.confirm")}
              </p>
              <p className="text-sm text-[var(--neu-text-secondary)] mt-1">
                {t("deleteDialog.warning")}
              </p>
            </div>
          </div>

          {selectedEmployee && (
            <div className="p-4 bg-[var(--neu-surface-light)] rounded-[var(--neu-radius)]">
              <p className="font-medium text-[var(--neu-text)]">{selectedEmployee.name}</p>
              <p className="text-sm text-[var(--neu-text-secondary)]">{selectedEmployee.email}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <NeuButton
              variant="danger"
              onClick={handleDelete}
              loading={isSubmitting}
              className="flex-1"
            >
              {t("deleteDialog.button")}
            </NeuButton>
            <NeuButton
              variant="ghost"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isSubmitting}
            >
              {tc("cancel")}
            </NeuButton>
          </div>
        </div>
      </NeuDialog>
    </div>
  );
}
