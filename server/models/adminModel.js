
const admin = require("firebase-admin");

class AdminModel {
  static async createUser({ email, password, displayName,role }) {
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName,
    });
// Set a default role
    await admin.auth().setCustomUserClaims(userRecord.uid, { role: role });

    return { uid: userRecord.uid, role };
  }

  static async getUsersInfo(uid) {
    const userRecord = await admin.auth().getUser(uid);

    return {
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      role: userRecord.customClaims ? userRecord.customClaims.role : null,
    };
  }
  static async getUsersByRole(role) {
    const listUsersResult = await admin.auth().listUsers(1000, undefined, {
      customClaims: true,
    });

    const usersByRole = listUsersResult.users
      .filter((userRecord) => userRecord.customClaims && userRecord.customClaims.role === role)
      .map((userRecord) => ({
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        role: userRecord.customClaims.role || null,
      }));

    return usersByRole;
  }
  static async updateUser(uid, updatedData) {
    const userRecord = await admin.auth().updateUser(uid, updatedData);
  
    return {
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      role: userRecord.customClaims ? userRecord.customClaims.role : null,
    };
  }
  static async deleteUser(uid) {
    try {
      await admin.auth().deleteUser(uid);
      return { message: "User deleted successfully" };
    } catch (error) {
      console.error("Error deleting user", error);
      throw new Error("Error deleting user");
    }
  }
  static async getAllUsers() {
    const listUsersResult = await admin.auth().listUsers(1000, undefined, {
      customClaims: true,
    });

    return listUsersResult.users.map((userRecord) => ({
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      role: userRecord.customClaims ? userRecord.customClaims.role : null,
    }));
  }

  static async deleteAllUsers() {
    const listUsersResult = await admin.auth().listUsers(1000);

    await Promise.all(
      listUsersResult.users.map(async (user) => {
        await admin.auth().deleteUser(user.uid);
      })
    );

    return { message: "All users deleted successfully" };
  }
}

module.exports = AdminModel;
