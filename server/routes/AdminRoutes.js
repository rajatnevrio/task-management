// routes/userRoutes.js

const express = require("express");
const router = express.Router();
const AdminController = require("../controllers/AdminController");

router.post("/createUser", AdminController.createUser);
router.get("/getUserInfo/:uid", AdminController.getUsersInfo);
router.get("/getUsersByRole/:role", AdminController.getUsersByRole);

router.get("/getAllUsers", AdminController.getAllUsers);
router.delete("/deleteAllUsers", AdminController.deleteAllUsers);
router.delete('/deleteUser/:email', AdminController.deleteUser);
router.put('/updateUser/:uid', AdminController.updateUser);
module.exports = router;
