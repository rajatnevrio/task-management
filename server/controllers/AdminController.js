
const adminModel = require("../models/adminModel");

class AdminController {
  static async createUser(req, res) {
    try {
      const { email, password, displayName } = req.body;
      const userRole = req.body.role || "employee"
      const result = await adminModel.createUser({ email, password, displayName,role:userRole });
      res.status(200).json(result);
    } catch (error) {
      console.error("Error creating user:", error.message);
      res.status(500).json({ error: error.message });
    }
  }

  static async getUsersInfo(req, res) {
    try {
      const uid = req.params.uid;
      const result = await adminModel.getUsersInfo(uid);
      res.status(200).json(result);
    } catch (error) {
      console.error("Error retrieving user:", error);
      res.status(500).json({ error: "Error retrieving user" });
    }
  }

  static async getAllUsers(req, res) {
    try {
      const result = await adminModel.getAllUsers();
      const employeeUsers = result;
    
      res.status(200).json(employeeUsers);
    } catch (error) {
      console.error("Error retrieving all users:", error);
      res.status(500).json({ error: "Error retrieving all users" });
    }
  }
  static async getUsersByRole(req, res) {
    try {
      const role = req.params.role; // assuming role is provided in the request parameters
      const result = await adminModel.getAllUsers();
      const usersByRole = result.filter((user) => user.role === role);

      res.status(200).json(usersByRole);
    } catch (error) {
      console.error("Error retrieving users by role:", error);
      res.status(500).json({ error: "Error retrieving users by role" });
    }
  }
  static async updateUser(req, res) {
    try {
      const { uid } = req.params;
      const updatedData = req.body;
  
      const result = await adminModel.updateUser(uid, updatedData);
      res.status(200).json(result);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Error updating user" });
    }
  }
 static async deleteUser(req, res) {
    try {
      const email = req.params.email;
      const result = await adminModel.deleteUser(email);
      res.status(200).json(result);
    } catch (error) {
      console.error("Error deleting user by email:", error);
      res.status(500).json({ error: "Error deleting user by email" });
    }
  }
  static async deleteAllUsers(req, res) {
    try {
      const result = await adminModel.deleteAllUsers();
      res.status(200).json(result);
    } catch (error) {
      console.error("Error deleting all users:", error);
      res.status(500).json({ error: "Error deleting all users" });
    }
  }
}

module.exports = AdminController;
