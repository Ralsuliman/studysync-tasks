import { useEffect, useState } from "react";
import "../App.css";  // reuse your existing styles

function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [error, setError] = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  // --- health check
  useEffect(() => {
    fetch("http://localhost:8080/api/health")
      .then((res) => res.json())
      .then((data) => console.log("Backend says:", data))
      .catch(console.error);
  }, []);

  // --- load tasks
  useEffect(() => {
    const loadTasks = async () => {
      try {
        setLoadingTasks(true);
        const res = await fetch("http://localhost:8080/api/tasks");
        const data = await res.json();
        setTasks(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load tasks");
      } finally {
        setLoadingTasks(false);
      }
    };

    loadTasks();
  }, []);

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const res = await fetch("http://localhost:8080/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTaskTitle.trim() }),
    });

    const created = await res.json();
    setTasks((prev) => [...prev, created]);
    setNewTaskTitle("");
  };

  const handleToggleTask = async (id) => {
    await fetch(`http://localhost:8080/api/tasks/${id}`, {
      method: "PUT",
    });
    setTasks((prev) =>
      prev.map((task) =>
        task._id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const handleDeleteTask = async (id) => {
    await fetch(`http://localhost:8080/api/tasks/${id}`, {
      method: "DELETE",
    });
    setTasks((prev) => prev.filter((task) => task._id !== id));
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>StudySync Tasks</h1>
        <p className="subtitle">
          Cloud-based academic to-do list for student groups
        </p>
      </header>

      <main className="app-main">
        <section className="card">
          <h2>My Courses</h2>
          <ul>
            <li>CS335 – Cloud Computing</li>
            <li>CS101 – Introduction to Programming</li>
            <li>IT202 – Web Technologies</li>
          </ul>
        </section>

        <section className="card">
          <h2>Today's Tasks</h2>

          <form className="task-form" onSubmit={handleAddTask}>
            <input
              type="text"
              placeholder="New task title..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
            />
            <button type="submit">Add</button>
          </form>

          {loadingTasks && <p>Loading tasks...</p>}
          {error && <p style={{ color: "red" }}>{error}</p>}

          <ul className="task-list">
            {tasks.map((task) => (
              <li key={task._id} className="task-item">
                <span
                  onClick={() => handleToggleTask(task._id)}
                  style={{
                    cursor: "pointer",
                    textDecoration: task.completed ? "line-through" : "none",
                  }}
                >
                  {task.title}
                </span>
                <button
                  className="delete-btn"
                  onClick={() => handleDeleteTask(task._id)}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;