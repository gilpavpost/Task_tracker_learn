const pool = require('../config/db');

const getAllProjects = async (req, res) => {
  try {
    const [projects] = await pool.query(
      `SELECT p.*, u.username as created_by_username
       FROM projects p
       LEFT JOIN users u ON p.created_by = u.id
       WHERE p.created_by = ?`,
      [req.userId]
    );
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching projects', error: error.message });
  }
};

const createProject = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    const [result] = await pool.query(
      'INSERT INTO projects (name, description, created_by) VALUES (?, ?, ?)',
      [name, description, req.userId]
    );
    
    const [project] = await pool.query(
      'SELECT * FROM projects WHERE id = ?',
      [result.insertId]
    );
    
    res.status(201).json(project[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error creating project', error: error.message });
  }
};

const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    
    // Check if user owns the project
    const [existingProject] = await pool.query(
      'SELECT * FROM projects WHERE id = ? AND created_by = ?',
      [id, req.userId]
    );
    
    if (existingProject.length === 0) {
      return res.status(404).json({ message: 'Project not found or access denied' });
    }
    
    const [result] = await pool.query(
      'UPDATE projects SET name = ?, description = ? WHERE id = ?',
      [name, description, id]
    );
    
    const [updatedProject] = await pool.query(
      'SELECT * FROM projects WHERE id = ?',
      [id]
    );
    
    res.json(updatedProject[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error updating project', error: error.message });
  }
};

const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user owns the project
    const [existingProject] = await pool.query(
      'SELECT * FROM projects WHERE id = ? AND created_by = ?',
      [id, req.userId]
    );
    
    if (existingProject.length === 0) {
      return res.status(404).json({ message: 'Project not found or access denied' });
    }
    
    // Delete associated tasks first
    await pool.query('DELETE FROM tasks WHERE project_id = ?', [id]);
    
    // Delete the project
    await pool.query('DELETE FROM projects WHERE id = ?', [id]);
    
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting project', error: error.message });
  }
};

const getProjectTasks = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user has access to the project
    const [project] = await pool.query(
      'SELECT * FROM projects WHERE id = ? AND created_by = ?',
      [id, req.userId]
    );
    
    if (project.length === 0) {
      return res.status(404).json({ message: 'Project not found or access denied' });
    }
    
    const [tasks] = await pool.query(
      'SELECT * FROM tasks WHERE project_id = ?',
      [id]
    );
    
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching project tasks', error: error.message });
  }
};

const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const [project] = await pool.query(
      `SELECT p.*, u.username as created_by_username
       FROM projects p
       LEFT JOIN users u ON p.created_by = u.id
       WHERE p.id = ? AND p.created_by = ?`,
      [id, req.userId]
    );
    if (project.length === 0) {
      return res.status(404).json({ message: 'Project not found or access denied' });
    }
    res.json(project[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching project', error: error.message });
  }
};

module.exports = {
  getAllProjects,
  createProject,
  updateProject,
  deleteProject,
  getProjectTasks,
  getProjectById
};