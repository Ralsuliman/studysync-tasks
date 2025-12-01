import "./App.css";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:8080";


const COURSES = [
  { id: "CS335", label: "CS335 – Cloud Computing" },
  { id: "CS101", label: "CS101 – Introduction to Programming" },
  { id: "IT202", label: "IT202 – Web Technologies" },
];

function App() {
  // ----- Login State -----
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginMessage, setLoginMessage] = useState("");

  // ----- Register State -----
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerMessage, setRegisterMessage] = useState("");
  const [previewEmailUrl, setPreviewEmailUrl] = useState("");

  // ----- Auth token + user -----
  const [token, setToken] = useState(null);
  const [userName, setUserName] = useState("");

  // ----- Tasks -----
  const [tasks, setTasks] = useState([]);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newPriority, setNewPriority] = useState("Medium");
  const [newAssignedTo, setNewAssignedTo] = useState("");
  const [newCourse, setNewCourse] = useState("CS335");
  const [tasksError, setTasksError] = useState("");
  const [loadingTasks, setLoadingTasks] = useState(false);

  // ----- Editing state -----
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editPriority, setEditPriority] = useState("Medium");
  const [editAssignedTo, setEditAssignedTo] = useState("");
  const [editCourse, setEditCourse] = useState("CS335");

  // ----- Filtering & Sorting -----
  const [filterStatus, setFilterStatus] = useState("All"); // All, Pending, Completed
  const [filterPriority, setFilterPriority] = useState("All"); // All, Low, Medium, High
  const [filterCourse, setFilterCourse] = useState("All"); // All courses / specific course
  const [sortBy, setSortBy] = useState("None"); // None, DueAsc, DueDesc, Priority

  // Load tasks AFTER login
  useEffect(() => {
    if (!token) {
      setTasks([]);
      return;
    }

    const loadTasks = async () => {
      try {
        setLoadingTasks(true);
        setTasksError("");
        const res = await fetch(`${API_URL}/api/tasks`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();

        if (!res.ok) {
          setTasksError(data.error || "Failed to load tasks");
          return;
        }

        setTasks(data);
      } catch (err) {
        console.error("Tasks error:", err);
        setTasksError("Failed to load tasks");
      } finally {
        setLoadingTasks(false);
      }
    };

    loadTasks();
  }, [token]);

  // ----- Real-time sync: Socket.IO -----
  useEffect(() => {
    if (!token) return;
  
    const s = io(SOCKET_URL, {
      transports: ["websocket"],
    });
  
    console.log("Socket connected:", s.id);
  
    s.on("taskCreated", (task) => {
      setTasks((prev) => {
        if (prev.find((t) => t._id === task._id)) return prev;
        return [...prev, task];
      });
    });
  
    s.on("taskUpdated", (task) => {
      setTasks((prev) => prev.map((t) => (t._id === task._id ? task : t)));
    });
  
    s.on("taskDeleted", ({ id }) => {
      setTasks((prev) => prev.filter((t) => t._id !== id));
    });
  
    s.on("disconnect", () => {
      console.log("Socket disconnected");
    });
  
    return () => {
      s.disconnect();
    };
  }, [token]);

  // Add task
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!token) {
      setTasksError("Please log in to add tasks.");
      return;
    }
    if (!newTitle.trim()) return;

    const body = {
      title: newTitle.trim(),
      description: newDescription.trim(),
      dueDate: newDueDate || null,
      priority: newPriority,
      assignedTo: newAssignedTo.trim(),
      course: newCourse,
    };

    const res = await fetch(`${API_URL}/api/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (!res.ok) {
      setTasksError(data.error || "Failed to add task");
      return;
    }

    setTasks((prev) => [...prev, data]);
    setNewTitle("");
    setNewDescription("");
    setNewDueDate("");
    setNewPriority("Medium");
    setNewAssignedTo("");
    setNewCourse("CS335");
  };

  // Toggle task completion
  const handleToggle = async (task) => {
    if (!token) return;

    const res = await fetch(`${API_URL}/api/tasks/${task._id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ completed: !task.completed }),
    });
    const data = await res.json();

    if (!res.ok) {
      setTasksError(data.error || "Failed to update task");
      return;
    }

    setTasks((t) => t.map((x) => (x._id === task._id ? data : x)));
  };

  // Delete task
  const handleDelete = async (id) => {
    if (!token) return;

    const res = await fetch(`${API_URL}/api/tasks/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();

    if (!res.ok) {
      setTasksError(data.error || "Failed to delete task");
      return;
    }

    setTasks((t) => t.filter((x) => x._id !== id));
  };

  // Start editing a task
  const startEditing = (task) => {
    setEditingId(task._id);
    setEditTitle(task.title);
    setEditDescription(task.description || "");
    setEditDueDate(task.dueDate ? task.dueDate.substring(0, 10) : "");
    setEditPriority(task.priority || "Medium");
    setEditAssignedTo(task.assignedTo || "");
    setEditCourse(task.course || "CS335");
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingId(null);
    setEditTitle("");
    setEditDescription("");
    setEditDueDate("");
    setEditPriority("Medium");
    setEditAssignedTo("");
    setEditCourse("CS335");
  };

  // Save edited task
  const handleEditSave = async (e) => {
    e.preventDefault();
    if (!token || !editingId) return;

    const body = {
      title: editTitle.trim(),
      description: editDescription.trim(),
      dueDate: editDueDate || null,
      priority: editPriority,
      assignedTo: editAssignedTo.trim(),
      course: editCourse,
    };

    const res = await fetch(`${API_URL}/api/tasks/${editingId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (!res.ok) {
      setTasksError(data.error || "Failed to update task");
      return;
    }

    setTasks((t) => t.map((x) => (x._id === editingId ? data : x)));
    cancelEditing();
  };

// Login
const handleLogin = async (e) => {
  e.preventDefault();
  setLoginMessage("");

  try {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: loginEmail, password: loginPassword }),
    });

    let data = {};
    try {
      data = await res.json();
    } catch {
      // ignore JSON parse errors
    }

    if (res.ok) {
      setToken(data.token);
      setUserName(data.user.name);
      setLoginMessage("Logged in as " + data.user.name);
      setLoginPassword("");
    } else {
      setToken(null);
      setUserName("");
      setLoginMessage(data.error || "Login failed.");
    }
  } catch (err) {
    console.error("Login network error:", err);
    setLoginMessage("Could not reach server. Check API_URL and backend.");
  }
};

  // Register (with email verification)
const handleRegister = async (e) => {
  e.preventDefault();
  setRegisterMessage("");
  setPreviewEmailUrl("");

  try {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: registerName,
        email: registerEmail,
        password: registerPassword,
      }),
    });

    let data = {};
    try {
      data = await res.json();
    } catch {
      // ignore JSON parse errors
    }

    if (res.ok) {
      setRegisterMessage(
        data.message ||
          "Account created! A verification email has been sent. Please verify your email before logging in."
      );

      if (data.previewEmailURL) {
        setPreviewEmailUrl(data.previewEmailURL);
      }
    } else {
      setRegisterMessage(data.error || "Registration failed.");
    }
  } catch (err) {
    console.error("Register network error:", err);
    setRegisterMessage("Could not reach server. Check API_URL and backend.");
  }
};

  // Logout
  const handleLogout = () => {
    setToken(null);
    setUserName("");
    setTasks([]);
    setLoginMessage("Logged out.");
  };

  // ----- Derived: filtered + sorted tasks -----
  const priorityRank = (p) => {
    if (p === "High") return 3;
    if (p === "Medium") return 2;
    if (p === "Low") return 1;
    return 0;
  };

  let displayedTasks = [...tasks];

  // Filter by course
  if (filterCourse !== "All") {
    displayedTasks = displayedTasks.filter(
      (t) => (t.course || "CS335") === filterCourse
    );
  }

  // Filter by status
  if (filterStatus === "Completed") {
    displayedTasks = displayedTasks.filter((t) => t.completed);
  } else if (filterStatus === "Pending") {
    displayedTasks = displayedTasks.filter((t) => !t.completed);
  }

  // Filter by priority
  if (filterPriority !== "All") {
    displayedTasks = displayedTasks.filter(
      (t) => (t.priority || "Medium") === filterPriority
    );
  }

  // Sort
  displayedTasks.sort((a, b) => {
    if (sortBy === "DueAsc") {
      const da = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_VALUE;
      const db = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_VALUE;
      return da - db;
    }
    if (sortBy === "DueDesc") {
      const da = a.dueDate ? new Date(a.dueDate).getTime() : 0;
      const db = b.dueDate ? new Date(b.dueDate).getTime() : 0;
      return db - da;
    }
    if (sortBy === "Priority") {
      return priorityRank(b.priority) - priorityRank(a.priority);
    }
    return 0;
  });

  // ----- Dashboard summary per course -----
  const dashboard = COURSES.map((c) => {
    const tasksForCourse = tasks.filter(
      (t) => (t.course || "CS335") === c.id
    );
    const completed = tasksForCourse.filter((t) => t.completed).length;
    return {
      courseId: c.id,
      label: c.label,
      total: tasksForCourse.length,
      completed,
      pending: tasksForCourse.length - completed,
    };
  });

  return (
    <div className="app">
      <header className="app-header">
        <h1>StudySync Tasks</h1>
        {userName && (
          <p style={{ marginTop: "10px" }}>Logged in as {userName}</p>
        )}
      </header>

      {/* Login + Register Section */}
      <section style={{ padding: "20px", textAlign: "center" }}>
        <h3>Login</h3>
        <form className="auth-form" onSubmit={handleLogin}>
          <input
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            placeholder="Email"
            type="email"
          />
          <input
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            placeholder="Password"
            type="password"
          />
          <button type="submit">Login</button>
          {token && (
            <button type="button" onClick={handleLogout}>
              Logout
            </button>
          )}
        </form>
        {loginMessage && <p>{loginMessage}</p>}

        <hr style={{ margin: "30px 0", opacity: 0.3 }} />

        <h3>Register</h3>
        <form className="auth-form" onSubmit={handleRegister}>
          <input
            value={registerName}
            onChange={(e) => setRegisterName(e.target.value)}
            placeholder="Name"
          />
          <input
            value={registerEmail}
            onChange={(e) => setRegisterEmail(e.target.value)}
            placeholder="Email"
            type="email"
          />
          <input
            value={registerPassword}
            onChange={(e) => setRegisterPassword(e.target.value)}
            placeholder="Password"
            type="password"
          />
          <button type="submit">Register</button>
        </form>

        {registerMessage && <p>{registerMessage}</p>}

        {previewEmailUrl && (
          <p style={{ fontSize: "0.85rem" }}>
            For demo purposes, click here to open the verification email:{" "}
            <a href={previewEmailUrl} target="_blank" rel="noreferrer">
              Open verification email
            </a>
          </p>
        )}
      </section>

      {/* Tasks Section */}
      <main className="app-main">
        <section className="card">
          <h2>Tasks</h2>

          {token && (
      <div className="course-tabs">
        <button
          className={
            filterCourse === "All" ? "course-tab active" : "course-tab"
          }
          onClick={() => setFilterCourse("All")}
        >
          All courses
        </button>
        {COURSES.map((c) => (
          <button
            key={c.id}
            className={
              filterCourse === c.id ? "course-tab active" : "course-tab"
            }
            onClick={() => setFilterCourse(c.id)}
          >
            {c.id}
          </button>
        ))}
      </div>
    )}

          {!token && <p>Please log in to view and manage tasks.</p>}

          {token && (
            <>
              {/* DASHBOARD – OVERVIEW ACROSS COURSES */}
              <h4 className="section-title">Dashboard – Tasks per Course</h4>
              <div className="dashboard">
                {dashboard.map((row) => (
                  <div key={row.courseId} className="dashboard-row">
                    <div className="dashboard-course">{row.label}</div>
                    <div className="dashboard-counts">
                      <div>Total: {row.total}</div>
                      <div>Pending: {row.pending}</div>
                      <div>Done: {row.completed}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add New Task */}
              <h4 className="section-title">Add New Task</h4>
              <form className="task-form" onSubmit={handleAdd}>
                <select
                  value={newCourse}
                  onChange={(e) => setNewCourse(e.target.value)}
                >
                  {COURSES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <input
                  placeholder="Title (required)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
                <input
                  placeholder="Description"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                />
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                />
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
                <input
                  placeholder="Assigned to"
                  value={newAssignedTo}
                  onChange={(e) => setNewAssignedTo(e.target.value)}
                />
                <button type="submit">Add</button>
              </form>

              {/* Filters + Sorting */}
            <h4 className="section-title">Filter &amp; Sort</h4>
              <div className="filters-row">
                <div className="filter-item">
                  <span className="filter-label">Status</span>
                  <select
                    className="filter-select"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="All">All</option>
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div className="filter-item">
                  <span className="filter-label">Priority</span>
                  <select
                    className="filter-select"
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                  >
                    <option value="All">All</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div className="filter-item">
                  <span className="filter-label">Sort by</span>
                  <select
                    className="filter-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="None">None</option>
                    <option value="DueAsc">Due date (earliest)</option>
                    <option value="DueDesc">Due date (latest)</option>
                    <option value="Priority">Priority (High → Low)</option>
                  </select>
                </div>
              </div>




              {loadingTasks && <p>Loading tasks...</p>}
              {tasksError && <p style={{ color: "red" }}>{tasksError}</p>}

              {/* Existing Tasks */}
              <h4 className="section-title">Existing Tasks</h4>
              <ul className="task-list">
                {displayedTasks.map((task) => (
                  <li key={task._id} className="task-item">
                    {editingId === task._id ? (
                      // Edit form for this task
                      <form className="edit-form" onSubmit={handleEditSave}>
                        <select
                          value={editCourse}
                          onChange={(e) => setEditCourse(e.target.value)}
                        >
                          {COURSES.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                        <input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          placeholder="Title"
                        />
                        <input
                          value={editDescription}
                          onChange={(e) =>
                            setEditDescription(e.target.value)
                          }
                          placeholder="Description"
                        />
                        <input
                          type="date"
                          value={editDueDate}
                          onChange={(e) => setEditDueDate(e.target.value)}
                        />
                        <select
                          value={editPriority}
                          onChange={(e) => setEditPriority(e.target.value)}
                        >
                          <option>Low</option>
                          <option>Medium</option>
                          <option>High</option>
                        </select>
                        <input
                          value={editAssignedTo}
                          onChange={(e) =>
                            setEditAssignedTo(e.target.value)
                          }
                          placeholder="Assigned to"
                        />
                        <div className="edit-buttons">
                          <button type="submit">Save</button>
                          <button type="button" onClick={cancelEditing}>
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      // Normal display of task
                      <>
                        <div className="task-text">
                          <span className="task-course">
                            {
                              (
                                COURSES.find(
                                  (c) => c.id === (task.course || "CS335")
                                ) || { label: task.course || "CS335" }
                              ).label
                            }
                          </span>
                          <span
                            onClick={() => handleToggle(task)}
                            className={
                              task.completed ? "task-title done" : "task-title"
                            }
                          >
                            {task.title}
                          </span>
                          {task.description && (
                            <span className="task-description">
                              {task.description}
                            </span>
                          )}
                          <div className="task-meta">
                            <span>
                              {task.dueDate
                                ? `Due: ${task.dueDate.substring(0, 10)}`
                                : "No due date"}
                            </span>
                            <span>Priority: {task.priority || "Medium"}</span>
                            {task.assignedTo && (
                              <span>Assigned to: {task.assignedTo}</span>
                            )}
                          </div>
                        </div>
                        <div className="task-actions">
                          <button
                            className="delete-btn"
                            onClick={() => handleDelete(task._id)}
                          >
                            ✕
                          </button>
                          <button
                            type="button"
                            className="edit-btn"
                            onClick={() => startEditing(task)}
                          >
                            Edit
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;