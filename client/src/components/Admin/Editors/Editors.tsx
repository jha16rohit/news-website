import React, { useEffect, useState } from "react";
import "./Editors.css";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  UserPlus,
  Mail,
  User,
  ShieldCheck,
  KeyRound,
  Power,
  Eye,
  AlertTriangle,
  Settings2,
  Phone,
} from "lucide-react";

import { apiClient } from "../../../api/client";
import Preloader from "../Preloader/Preloder";

interface Editor {
  _id: string;
  name: string;
  userId: string;
  email: string;
  phone: string;
  role: "EDITOR";
  permissions: string[];
  status: "Active" | "Inactive" | "Deleted";
  createdAt: string;
  newsCount: number;
}



const editorPermissionPages = [
  { id: "news", label: "All News" },
  { id: "create-news", label: "Create News" },
  { id: "topic-profile", label: "Topic Profile" },
  { id: "breaking-news", label: "Breaking News" },
  { id: "live-news", label: "Live News" },
  { id: "scheduled", label: "Scheduled" },
  { id: "categories", label: "Categories" },
  { id: "tags", label: "Tags" },
  { id: "media-library", label: "Media Library" },
];

const Editors: React.FC = () => {
  const [editors, setEditors] = useState<Editor[]>([]);
const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Inactive" | "Deleted">("All");
  

  const [showAddEditor, setShowAddEditor] = useState(false);
  const [showDetails, setShowDetails] = useState<Editor | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Editor | null>(
    null
  );


  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [editingEditor, setEditingEditor] = useState<Editor | null>(null);
  const [newEditorPermissions, setNewEditorPermissions] = useState<string[]>([
     "scheduled",
  "create-news",
  ]);
  const [permissionEditor, setPermissionEditor] = useState<Editor | null>(null);
const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const [newEditor, setNewEditor] = useState({
  name: "",
  email: "",
  phone: "",
  userId: "",
});



const getEditors = () =>
  apiClient("/api/admin/users");

const createEditor = (data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  permissions: string[];
}) =>
  apiClient("/api/admin/users", {
    method: "POST",
    body: JSON.stringify(data),
  });

const updateEditor = (
  id: string,
  data: {
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
  }
) =>
  apiClient(`/api/admin/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

const updateEditorPermissions = (
  id: string,
  permissions: string[]
) =>
  apiClient(`/api/admin/users/${id}/permissions`, {
    method: "PUT",
    body: JSON.stringify({ permissions }),
  });

    const updateEditorStatus = (
  id: string,
  status: "Active" | "Inactive"
) =>
  apiClient(`/api/admin/users/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),


  });

const deleteEditor = (id: string) =>
  apiClient(`/api/admin/users/${id}`, {
    method: "DELETE",
  });

  useEffect(() => {
  const loadEditors = async () => {
    try {
      const res = await getEditors();
      setEditors(res.editors || []);
    } catch (error) {
      console.error("Failed to load editors:", error);
    } finally {
      setLoading(false);
    }
  };

  loadEditors();
}, []);

  useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement;

    if (!target.closest(".more-wrapper")) {
      setOpenMenu(null);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);

 const filteredEditors = editors.filter((editor) => {
  const query = search.toLowerCase();

  const matchesSearch =
    editor.name.toLowerCase().includes(query) ||
    editor.userId.toLowerCase().includes(query) ||
    editor.email.toLowerCase().includes(query);

const matchesStatus =
  statusFilter === "All"
    ? editor.status !== "Deleted"
    : editor.status === statusFilter;

  return matchesSearch && matchesStatus;
});


const toggleEditorPermission = (permissionId: string) => {
  setNewEditorPermissions((prev) =>
    prev.includes(permissionId)
      ? prev.filter((id) => id !== permissionId)
      : [...prev, permissionId]
  );
};

const openManagePermissions = (editor: Editor) => {
  setPermissionEditor({ ...editor });
  setSelectedPermissions([...editor.permissions]);
  setOpenMenu(null);
};

const togglePermission = (permissionId: string) => {
  setSelectedPermissions((prev) =>
    prev.includes(permissionId)
      ? prev.filter((id) => id !== permissionId)
      : [...prev, permissionId]
  );
};

const savePermissions = async () => {
  if (!permissionEditor) return;

  try {
    const res = await updateEditorPermissions(
      permissionEditor._id,
      selectedPermissions
    );

    const updatedEditor = res.user;

    setEditors((prev) =>
      prev.map((editor) =>
        editor._id === permissionEditor._id
          ? {
              ...editor,
              ...updatedEditor,
            }
          : editor
      )
    );

    setPermissionEditor(null);
    setSelectedPermissions([]);
  } catch (error) {
    console.error("Failed to update permissions:", error);
  }
};


const handleAddEditor = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!newEditor.name || !newEditor.email || !newEditor.phone) {
    return;
  }

  try {
    // Temporary password generated for the new Editor.
    // Email delivery can be connected separately.
    const temporaryPassword = `Editor@${Math.random()
      .toString(36)
      .slice(-8)}`;

    const res = await createEditor({
      name: newEditor.name.trim(),
      email: newEditor.email.trim(),
      phone: newEditor.phone.trim(),
      password: temporaryPassword,
      permissions: newEditorPermissions,
    });

    if (res.user) {
      setEditors((prev) => [res.user, ...prev]);
    }

    setNewEditor({
      name: "",
      email: "",
      phone: "",
      userId: "",
    });

    setNewEditorPermissions([
      "scheduled",
      "create-news",
    ]);

    setShowAddEditor(false);
  } catch (error) {
    console.error("Failed to create editor:", error);
  }
};

  // DELETE

const handleDelete = async () => {
  if (!showDeleteConfirm) return;

  try {
    const res = await deleteEditor(showDeleteConfirm._id);

    const updatedEditor = res.user;

    setEditors((prev) =>
      prev.map((editor) =>
        editor._id === showDeleteConfirm._id
          ? {
              ...editor,
              ...updatedEditor,
              status: "Deleted",
            }
          : editor
      )
    );

    setShowDeleteConfirm(null);
    setOpenMenu(null);
  } catch (error) {
    console.error("Failed to delete editor:", error);
  }
};
  // ACTIVATE / DEACTIVATE

const toggleStatus = async (id: string) => {
  const editor = editors.find((item) => item._id === id);

  if (!editor || editor.status === "Deleted") {
    return;
  }

  const newStatus =
    editor.status === "Active" ? "Inactive" : "Active";

  try {
    const res = await updateEditorStatus(id, newStatus);

    const updatedEditor = res.user;

    setEditors((prev) =>
      prev.map((item) =>
        item._id === id
          ? {
              ...item,
              ...updatedEditor,
            }
          : item
      )
    );

    setOpenMenu(null);
  } catch (error) {
    console.error("Failed to update editor status:", error);
  }
};

  // EDIT

  const openEdit = (editor: Editor) => {
    setEditingEditor({ ...editor });
    setOpenMenu(null);
  };

const saveEdit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!editingEditor) return;

  try {
    const res = await updateEditor(editingEditor._id, {
      name: editingEditor.name.trim(),
      email: editingEditor.email.trim(),
      phone: editingEditor.phone.trim(),
    });

    const updatedEditor = res.user;

    setEditors((prev) =>
      prev.map((editor) =>
        editor._id === editingEditor._id
          ? {
              ...editor,
              ...updatedEditor,
            }
          : editor
      )
    );

    setEditingEditor(null);
  } catch (error) {
    console.error("Failed to update editor:", error);
  }
};

if (loading) {
  return (
    <Preloader />
  );
}

  return (
    <div className="editors-page">
      {/* HEADER */}

      <div className="editors-header">
        <div className="page-title-row">
          

          <div>
            <h1>Editors</h1>
            <p>Manage editor accounts and their access.</p>
          </div>
        </div>

        <button
          className="add-editor-btn"
          onClick={() => setShowAddEditor(true)}
        >
          <Plus size={18} />
          Add New Editor
        </button>
      </div>

      {/* STATS */}

<div className="editor-stats">

  {/* TOTAL */}
  <button
    type="button"
    className={`editor-stat-card ${
      statusFilter === "All" ? "stat-card-selected" : ""
    }`}
    onClick={() => setStatusFilter("All")}
  >
    <div className="stat-icon">
      <User size={18} />
    </div>

    <div>
      <span>Total Editors</span>
      <strong>
  {editors.filter(
    (editor) =>
      editor.status === "Active" ||
      editor.status === "Inactive" ||
      editor.status === "Deleted"
  ).length}
</strong>
    </div>
  </button>

  {/* ACTIVE */}
  <button
    type="button"
    className={`editor-stat-card ${
      statusFilter === "Active" ? "stat-card-selected" : ""
    }`}
    onClick={() => setStatusFilter("Active")}
  >
    <div className="stat-icon active-stat">
      <ShieldCheck size={18} />
    </div>

    <div>
      <span>Active Editors</span>
      <strong>
        {editors.filter((editor) => editor.status === "Active").length}
      </strong>
    </div>
  </button>

  {/* INACTIVE */}
  <button
    type="button"
    className={`editor-stat-card ${
      statusFilter === "Inactive" ? "stat-card-selected" : ""
    }`}
    onClick={() => setStatusFilter("Inactive")}
  >
    <div className="stat-icon inactive-stat">
      <Power size={18} />
    </div>

    <div>
      <span>Inactive Editors</span>
      <strong>
        {editors.filter((editor) => editor.status === "Inactive").length}
      </strong>
    </div>
  </button>

  {/* DELETED */}
<button
  type="button"
  className={`editor-stat-card ${
    statusFilter === "Deleted" ? "stat-card-selected" : ""
  }`}
  onClick={() => setStatusFilter("Deleted")}
>
  <div className="stat-icon deleted-stat">
    <Trash2 size={18} />
  </div>

  <div>
    <span>Deleted Editors</span>
    <strong>
      {editors.filter((editor) => editor.status === "Deleted").length}
    </strong>
  </div>
</button>

</div>

      {/* EDITORS CARD */}

      <div className="editors-card">
        <div className="editors-card-header">
          <div>
            <h2>All Editors</h2>

            <span className="editor-count">
              {editors.length}{" "}
              {editors.length === 1 ? "Editor" : "Editors"}
            </span>
          </div>

          <div className="editor-search">
            <Search size={18} />

            <input
              type="text"
              placeholder="Search by name, ID or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* TABLE */}

        <div className="editors-table-wrapper">
          <table className="editors-table">
            <thead>
              <tr>
<th>Editor</th>
<th>User ID</th>
<th>Email</th>
<th>Pages</th>
<th>Status</th>
<th>Created On</th>
<th>News</th>
<th className="actions-heading">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredEditors.length > 0 ? (
                filteredEditors.map((editor) => (
                  <tr key={editor._id}>
                    <td>
                      <div className="editor-user">
                        <div className="editor-avatar">
                          {editor.name.charAt(0).toUpperCase()}
                        </div>

                        <div>
                          <div className="editor-name">{editor.name}</div>
                          <div className="editor-role">
                            Content Editor
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="editor-user-id">
                        {editor.userId}
                      </span>
                    </td>

                    <td>
                      <span className="editor-email">
                        {editor.email}
                      </span>
                    </td>

                    <td>
  <span className="editor-pages-count">
    {editor.permissions.length}
  </span>
</td>

                    <td>
                      <span
                        className={`status-badge ${
                          editor.status === "Active"
                            ? "status-active"
                            : "status-inactive"
                        }`}
                      >
                        <span className="status-dot" />
                        {editor.status}
                      </span>
                    </td>

                    <td>
                      <span className="created-date">
                        {editor.createdAt}
                      </span>
                    </td>
                    <td>
  <span className="editor-news-count">
    {editor.newsCount ?? 0}
  </span>
</td>

                    <td>
                      <div className="editor-actions">
                        

                        <div className="more-wrapper">
                          <button
                            className="action-btn more-btn"
                            title="More Actions"
                            onClick={() =>
                              setOpenMenu(
                                openMenu === editor._id ? null : editor._id
                              )
                            }
                          >
                            <span className="three-dots">⋮</span>
                          </button>

                          {openMenu === editor._id && (
                            <div className="editor-action-menu">
                              <button
                                onClick={() => {
                                  setShowDetails(editor);
                                  setOpenMenu(null);
                                }}
                              >
                                <Eye size={15} />
                                View Details
                              </button>

                              <button onClick={() => openEdit(editor)}>
                                <Pencil size={15} />
                                Edit Editor
                              </button>

                              <button onClick={() => openManagePermissions(editor)}>
                                <Settings2 size={15} />
                                Manage Permissions
                              </button>

                             

                              <button
                                onClick={() => toggleStatus(editor._id)}
                              >
                                <Power size={15} />
                                {editor.status === "Active"
                                  ? "Deactivate"
                                  : "Activate"}
                              </button>

                              <div className="menu-divider" />

                              <button
                                className="danger-menu-item"
                                onClick={() => {
                                  setShowDeleteConfirm(editor);
                                  setOpenMenu(null);
                                }}
                              >
                                <Trash2 size={15} />
                                Delete Editor
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8}>
                    <div className="empty-editors">
                      <div className="empty-icon">
                        <User size={24} />
                      </div>

                      <h3>No editors found</h3>

                      <p>No editors match your current search.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD EDITOR */}

      {showAddEditor && (
        <div
          className="editor-modal-overlay"
          onClick={() => setShowAddEditor(false)}
        >
          <div
            className="editor-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-heading">
                <div className="modal-icon">
                  <UserPlus size={21} />
                </div>

                <div>
                  <h2>Add New Editor</h2>
                  <p>
                    Create an editor account and send login details.
                  </p>
                </div>
              </div>

              <button
                className="modal-close-btn"
                onClick={() => setShowAddEditor(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddEditor}>
              <div className="form-field">
                <label>Full Name</label>

                <div className="form-input-wrapper">
                  <User size={17} />

<input
  type="text"
  placeholder="Enter editor name"
  value={newEditor.name}
  onChange={(e) => {
    setNewEditor((prev) => ({
      ...prev,
      name: e.target.value,
    }));
  }}
/>
                </div>
              </div>

              

              <div className="form-field">
                <label>Email</label>

                <div className="form-input-wrapper">
                  <Mail size={17} />

                  <input
                    type="email"
                    placeholder="Enter editor email"
                    value={newEditor.email}
                    onChange={(e) =>
                      setNewEditor({
                        ...newEditor,
                        email: e.target.value,
                      })
                    }
                  />
                </div>

                <span className="field-help">
                  A temporary password will be sent to this email.
                </span>
              </div>

              <div className="form-field">
                <label>Phone Number</label>

                <div className="form-input-wrapper">
                  <Phone size={17} />

                  <input
                    type="tel"
                    placeholder="Enter editor phone number"
                    value={newEditor.phone}
                    onChange={(e) =>
                      setNewEditor({
                        ...newEditor,
                        phone: e.target.value,
                      })
                    }
                  />
                </div>
              </div>


<div className="permissions-section">
  <div className="permissions-section-header">
    <div>
      <h3>Page Permissions</h3>
      <p>Select which pages this Editor can access.</p>
    </div>

    <span className="permissions-count">
      {newEditorPermissions.length} selected
    </span>
  </div>

  <div className="permissions-grid">
    {editorPermissionPages.map((page) => (
      <label
        key={page.id}
        className={`permission-checkbox ${
          newEditorPermissions.includes(page.id)
            ? "permission-checkbox-selected"
            : ""
        }`}
      >
        <input
          type="checkbox"
          checked={newEditorPermissions.includes(page.id)}
          onChange={() => toggleEditorPermission(page.id)}
        />

        <span className="custom-checkbox">
          {newEditorPermissions.includes(page.id) && "✓"}
        </span>

        <span className="permission-label">
          {page.label}
        </span>
      </label>
    ))}
  </div>
</div>

              <div className="temporary-password-info">
  <KeyRound size={17} />

  <div>
    <strong>Temporary password</strong>

    <p>
      A temporary password will be generated automatically for this
      Editor account.
    </p>
  </div>
</div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowAddEditor(false)}
                >
                  Cancel
                </button>

                <button type="submit" className="create-editor-btn">
                  <UserPlus size={17} />
                  Create Editor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE PERMISSIONS */}

{permissionEditor && (
  <div
    className="editor-modal-overlay"
    onClick={() => setPermissionEditor(null)}
  >
    <div
      className="editor-modal permissions-modal"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="modal-header">
        <div className="modal-heading">
          <div className="modal-icon">
            <Settings2 size={21} />
          </div>

          <div>
            <h2>Manage Permissions</h2>
            <p>
              Manage which pages{" "}
              <strong>{permissionEditor.name}</strong> can access.
            </p>
          </div>
        </div>

        <button
          className="modal-close-btn"
          onClick={() => setPermissionEditor(null)}
        >
          <X size={20} />
        </button>
      </div>

      <div className="permissions-section">
        <div className="permissions-section-header">
          <div>
            <h3>Page Permissions</h3>
            <p>Select the pages this Editor can access.</p>
          </div>

          <span className="permissions-count">
            {selectedPermissions.length} selected
          </span>
        </div>

        <div className="permissions-grid">
          {editorPermissionPages.map((page) => {
            const isSelected = selectedPermissions.includes(page.id);

            return (
              <label
                key={page.id}
                className={`permission-checkbox ${
                  isSelected
                    ? "permission-checkbox-selected"
                    : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => togglePermission(page.id)}
                />

                <span className="custom-checkbox">
                  {isSelected && "✓"}
                </span>

                <span className="permission-label">
                  {page.label}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="modal-actions">
        <button
          type="button"
          className="cancel-btn"
          onClick={() => setPermissionEditor(null)}
        >
          Cancel
        </button>

        <button
          type="button"
          className="create-editor-btn"
          onClick={savePermissions}
        >
          <Settings2 size={17} />
          Save Permissions
        </button>
      </div>
    </div>
  </div>
)}

      {/* DETAILS */}

      {showDetails && (
        <div
          className="editor-modal-overlay"
          onClick={() => setShowDetails(null)}
        >
          <div
            className="editor-modal details-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-heading">
                <div className="modal-icon">
                  <User size={21} />
                </div>

                <div>
                  <h2>Editor Details</h2>
                  <p>Account information</p>
                </div>
              </div>

              <button
                className="modal-close-btn"
                onClick={() => setShowDetails(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="details-content">
              <div className="details-profile">
                <div className="details-avatar">
                  {showDetails.name.charAt(0).toUpperCase()}
                </div>

                <div>
                  <h3>{showDetails.name}</h3>
                  <span>Editor</span>
                </div>
              </div>

              <div className="details-grid">
                <div className="detail-item">
                  <span>Name</span>
                  <strong>{showDetails.name}</strong>
                </div>

                <div className="detail-item">
                  <span>User ID</span>
                  <strong>{showDetails.userId}</strong>
                </div>

                <div className="detail-item">
                  <span>Email</span>
                  <strong>{showDetails.email}</strong>
                </div>

                <div className="detail-item">
  <span>Phone Number</span>
  <strong>{showDetails.phone}</strong>
</div>

                <div className="detail-item">
                  <span>Status</span>
                  <strong>{showDetails.status}</strong>
                </div>

                <div className="detail-item">
                  <span>Created On</span>
                  <strong>{showDetails.createdAt}</strong>
                </div>
              </div>
              <div className="details-permissions">
  <div className="details-permissions-header">
    <span>Page Permissions</span>
    <strong>{showDetails.permissions.length} Pages</strong>
  </div>

  <div className="details-permissions-list">
    {showDetails.permissions.length > 0 ? (
      showDetails.permissions.map((permissionId) => {
        const page = editorPermissionPages.find(
          (item) => item.id === permissionId
        );

        return page ? (
          <span
            key={permissionId}
            className="details-permission-item"
          >
            {page.label}
          </span>
        ) : null;
      })
    ) : (
      <span className="details-no-permissions">
        No pages assigned
      </span>
    )}
  </div>
</div>
            </div>
            

            <div className="details-footer">
              <button
                className="cancel-btn"
                onClick={() => setShowDetails(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT */}

      {editingEditor && (
        <div
          className="editor-modal-overlay"
          onClick={() => setEditingEditor(null)}
        >
          <div
            className="editor-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-heading">
                <div className="modal-icon">
                  <Pencil size={20} />
                </div>

                <div>
                  <h2>Edit Editor</h2>
                  <p>Update editor account information.</p>
                </div>
              </div>

              <button
                className="modal-close-btn"
                onClick={() => setEditingEditor(null)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveEdit}>
              <div className="form-field">
                <label>Full Name</label>

                <div className="form-input-wrapper">
                  <User size={17} />

                  <input
                    type="text"
                    value={editingEditor.name}
                    onChange={(e) =>
                      setEditingEditor({
                        ...editingEditor,
                        name: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="form-field">
                <label>User ID</label>

                <div className="form-input-wrapper">
                  <ShieldCheck size={17} />

                  <input
                    type="text"
                    value={editingEditor.userId}
                    onChange={(e) =>
                      setEditingEditor({
                        ...editingEditor,
                        userId: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="form-field">
                <label>Email</label>

                <div className="form-input-wrapper">
                  <Mail size={17} />

                  <input
                    type="email"
                    value={editingEditor.email}
                    onChange={(e) =>
                      setEditingEditor({
                        ...editingEditor,
                        email: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="form-field">
  <label>Phone Number</label>

  <div className="form-input-wrapper">
    <Phone size={17} />

    <input
      type="tel"
      placeholder="Enter editor phone number"
      value={editingEditor.phone}
      onChange={(e) =>
        setEditingEditor({
          ...editingEditor,
          phone: e.target.value,
        })
      }
    />
  </div>
</div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setEditingEditor(null)}
                >
                  Cancel
                </button>

                <button type="submit" className="create-editor-btn">
                  <Pencil size={17} />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}

      {showDeleteConfirm && (
        <div
          className="editor-modal-overlay"
          onClick={() => setShowDeleteConfirm(null)}
        >
          <div
            className="delete-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="delete-icon">
              <AlertTriangle size={25} />
            </div>

            <h2>Delete Editor?</h2>

            <p>
              Are you sure you want to delete{" "}
              <strong>{showDeleteConfirm.name}</strong>? This action
              cannot be undone.
            </p>

            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => setShowDeleteConfirm(null)}
              >
                Cancel
              </button>

              <button
                className="delete-confirm-btn"
                onClick={handleDelete}
              >
                <Trash2 size={16} />
                Delete Editor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Editors;