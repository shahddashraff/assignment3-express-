const fs= require("node:fs/promises");
const express = require("express");
const path= require("node:path") ;
const filePath= path.resolve("users.json")
console.log({filePath});
const app = express();
app.use(express.json());
async function readUsers() {
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data || []);
}

async function writeUsers(users) {
    await fs.writeFile(filePath, JSON.stringify (users, null, 2)).catch((err) => {
        console.error("Error writing users:", err);
    });
}

app.get("/users", async (req, res) => {
    try {
        const users = await readUsers();
        res.json( {message:"success", users});
    } catch (error) {
        console.error("Error reading users:", error);
        res.status(404).json({ error: "Users not found" });
    }
});

app.get("/users/get-by-name", async (req, res) => {
    const { keyword } = req.query;

    if (!keyword) {
        return res.status(400).json({ error: "Keyword is required" });
    }

    const allusers = await readUsers();

    const users = allusers.filter(
        (user) => user.name.toLowerCase() === keyword.toLowerCase()
    );

    res.json({ message: "success", users });
});

app.get("/users/filter", async (req, res) => {
    const minAge = parseInt(req.query.minAge);

    const users = await readUsers();

    const filteredUsers = users.filter((u) => u.age >= minAge);

    if (filteredUsers.length === 0) {
        return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "success", users: filteredUsers });
});


app.get("/users/:id", async (req, res) => {
    const userId = Number(req.params.id);

    if (userId <= 0 || isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
    }
    const users = await readUsers();
    const user = users.find((u) => u.id === userId);

    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "success", user });
});




app.post("/users", async (req, res) => {
    const { name, age, email } = req.body;
    const users = await readUsers();
    let errors = [];
    if(!name|| name.length<3 ){
        errors.push("Name should be at least 3 characters long");
    }
    if(!email || !email.includes("@")){
        errors.push("Invalid email address");
    }
    if(!age || isNaN(age) || age <= 0){
        errors.push("Age should be a positive number");
    }
    if(errors.length > 0){
        return res.status(400).json({ message: "Validation errors", errors });
    }
    if (users.some((u) => u.email === email)) {
        return res.status(400).json({ error: "Email already exists" });
    }
    const id=users [users.length - 1]?.id + 1 || 1;
    const newUser = { id, name, age, email };
    users.push(newUser);
    await writeUsers(users);
    res.status(201).json({ message: "User created successfully", user: newUser });
})


app.patch("/users/:id", async (req, res) => {
    const userId = parseInt(req.params.id);
    console.log("Body:", req.body);
const { name, age, email } = req.body || {};

    let errors = [];

    if (isNaN(userId) || userId <= 0) {
        errors.push("Invalid user ID");
    }

    if (!name && !email && age === undefined) {
        errors.push("At least one field must be provided for update");
    }

    if (name && name.length < 3) {
        errors.push("Name should be at least 3 characters long");
    }

    if (email && !email.includes("@")) {
        errors.push("Invalid email address");
    }

    if (errors.length) {
        return res.status(400).json({ message: "Validation errors", errors });
    }

    const users = await readUsers();

    const user = users.find((u) => u.id === userId);

    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }

    if (email && users.some((u) => u.email === email && u.id !== userId)) {
        return res.status(409).json({ error: "Email already exists" });
    }

    user.name = name || user.name;
    user.age = age !== undefined ? age : user.age;
    user.email = email || user.email;

    await writeUsers(users);

    res.json({ message: "User updated successfully", user });
});



app.delete("/users{/:id}", async (req, res) => {
    const userId = parseInt(req.params.id) || parseInt(req.body?.id);

    if (userId <= 0 || isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
    }
    const users = await readUsers();

    const userIndex = users.findIndex((u) => u.id === userId);

    if (userIndex === -1) {
        return res.status(404).json({ error: "User not found" });
    }

    users.splice(userIndex, 1);

    await writeUsers(users);

    res.json({ message: "User deleted successfully" });
});


app.get("/users/filter", async (req, res) => {
    const minAge = parseInt(req.query.minAge);

    const users = await readUsers();

    const filteredUsers = users.filter((u) => u.age >= minAge);

    res.json({ message: "success", users: filteredUsers });
});




app.all("{/*o}", (req, res) => {
    res.status(404).json({ error: "Route not found" });
}); 

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
