const mySql = require('mysql2');
const encrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = mySql.createConnection(
    {
        host: process.env.DATABASE_HOST,
        user: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE,
        port: process.env.DATABASE_PORT,
    }
);

function magic(value) {
    return value.trim().charAt(0).toUpperCase() + value.trim().slice(1);
}


exports.addAccount = (req, res) => {
    let { username, email, password, confirm_password, role } = req.body;

    username = magic(username);
    email = email.trim();
    password = password.trim();

    if (!username || !email || !password || !confirm_password || !role) {
        return res.render('register', {
            message: "Please fill in all fields"
        });
    }
    //
    if (password !== confirm_password) {
        return res.render('register', {
            message: "Passwords do not match"
        });
    }

    db.query(`SELECT * FROM users WHERE email = ?`, [email], async (err, data) => {
        if (err) {
            console.log(`Error: ${err}`);
            return res.render('register', {
                message: "Error Occurred"
            });
        } else {
            const hashPassword = await encrypt.hash(password, 8);
            if (data.length > 0) {
                return res.render('register', {
                    message: "User Account Already Exist"
                });
            } else {
                db.query(`INSERT INTO users SET ?`, [{
                    username: username,
                    email: email,
                    password: hashPassword,
                    role: role
                }], (err, result) => {
                    if (err) {
                        console.log(`Error: ${err}`);
                        return res.render('register', {
                            message: "Error Occurred"
                        });
                    } else {
                        return res.render('register', {
                            message: "User Account Has Been Added Successfully"
                        });
                    }
                });
            }
        }
    });

}

exports.loginAccount = async (req, res) => {
    let isAdmin = req.session.isAdmin;
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.render('index', {
                message: "Fields cannot be empty!"
            });
        } else {
            db.query('SELECT * FROM users WHERE email = ?',
                [email],
                async (err, data) => {
                    if (!data[0]) {
                        res.render('index', {
                            message: "Email is incorrect!"
                        })
                    } else if (!(await encrypt.compare(password, data[0].password))) {
                        res.render('index', {
                            message: "Password is Incorrect"
                        })
                    } else {
                        if (data[0].role == "admin") {
                            req.session.isAdmin = true;
                            isAdmin = req.session.isAdmin;
                            const user_id = data[0].user_id;
                            const token = jwt.sign(user_id, process.env.JWT_SECRET);
                            const cookieOption = {
                                expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 1000),
                                httpOnly: true
                            };
                            res.cookie("cookie_access_token", token, cookieOption);
                            db.query(`CALL get_student_info()`,
                                (err, data) => {
                                    if (err) {
                                        console.log(`Error: ${err}`);
                                    } else if (!data[0]) {
                                        console.log(isAdmin);
                                        res.render('studentsRecord', {
                                            admin: isAdmin,
                                            message: "No result found!"
                                        });
                                    } else {
                                        console.log(data);
                                        res.render('studentsRecord', {
                                            admin: isAdmin,
                                            title: "List of Users Admin",
                                            data: data[0]
                                        })
                                    }
                                }
                            )
                        } else {
                            req.session.isAdmin = false;
                            isAdmin = req.session.isAdmin;
                            const user_id = data[0].user_id;
                            const token = jwt.sign(user_id, process.env.JWT_SECRET);
                            const cookieOption = {
                                expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 1000),
                                httpOnly: true
                            };
                            res.cookie("cookie_access_token", token, cookieOption);
                            db.query(`CALL get_student_info()`,
                                (err, data) => {
                                    if (err) {
                                        console.log(`Error: ${err}`);
                                    } else if (!data[0]) {
                                        res.render('studentsRecord', {
                                            message: "No result found!"
                                        });
                                    } else {
                                        res.render('studentsRecord', {
                                            admin: isAdmin,
                                            title: "List of Users",
                                            data: data[0]
                                        })
                                    }
                                }
                            )
                        }

                    }
                }
            );
        }
    } catch (err) {
        console.log(`Error: ${err}`);
    }
}

exports.logoutAccount = (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            console.log(`Error: ${err}`);
        } else {
            res.clearCookie("cookie_access_token");
            res.redirect("/");
        }
    });

    // res.clearCookie("cookie_access_token").status(200);
    // res.render('index');
}

exports.updateForm = (req, res) => {
    const id = req.params.student_id;
    db.query(`SELECT * FROM students WHERE student_id = ?`,
        [id],
        (err, data) => {
            if (err) {
                console.log(`Error :${err}`)
            } else {
                console.log(data[0]);
                res.render('updateForm', {
                    title: "Updated Form",
                    data: data[0]

                })
            }

        }
    );
}

exports.updateUser = (req, res) => {
    const isAdmin = req.session.isAdmin;
    const { fName, lName, student_id, course_id } = req.body;
    db.query(`UPDATE students SET first_name = ?, last_name = ?, course_id = ? WHERE student_id = ?`,
        [fName, lName, course_id, student_id],
        (err, data) => {
            if (err) {
                console.log(`Read this -> ${err}`);
            } else {
                db.query(`CALL get_student_info();`,
                    (err, result) => {
                        if (err) {
                            console.log(`Error: ${err}`);
                        } else if (!result[0]) {
                            res.render('studentsRecord', {
                                message: "No result found!"
                            });
                        } else {
                            res.render('studentsRecord', {
                                admin: isAdmin,
                                title: "List of Users",
                                data: result[0]
                            })
                        }
                    }
                )
            }
        }
    )
}

exports.deleteUser = (req, res) => {
    const student_id = req.params.student_id;
    const isAdmin = req.session.isAdmin;
    db.query(`DELETE FROM students WHERE student_id = ?`,
        [student_id],
        (err, data) => {

            if (err) {
                console.log(`Error: ${err}`);
            } else {
                db.query(`SELECT * FROM students`,
                    (err, result) => {
                        if (err) {
                            console.log(`Read this shit -> ${err}`)
                        } else if (!result[0]) {
                            res.render('studentsRecord', {
                                admin: isAdmin,
                                message: "No result found!"
                            })
                        } else {
                            res.render('studentsRecord', {
                                admin: isAdmin,
                                title: "List of Users",
                                data: result
                            })
                        }
                    }
                )
            }
        }
    )
}

exports.studentForm = (req, res) => {
    res.render('addStudent', {
        message: "Add Student"
    })
}

exports.addStudent = (req, res) => {
    let { fName, lName, email, course_id } = req.body;

    fName = magic(fName);
    lName = magic(lName);
    email = email.trim();

    if (!fName || !lName || !email || !course_id) {
        return res.render('addStudent', {
            message: "Please fill in all fields"
        });
    }

    db.query(`CALL add_student(?, ?, ?, ?)`,
        [fName, lName, email, course_id],
        (err, result) => {
            if (err) {
                console.log(err);
            } else {
                res.render(`addStudent`, {
                    message: "Success!"
                })
            }
        })
}

exports.toRecord = (req, res) => {
    const isAdmin = req.session.isAdmin;

    db.query(`CALL get_student_info();`,
        (err, result) => {
            if (err) {
                console.log(`Error: ${err}`);
            } else if (!result[0]) {
                res.render('studentsRecord', {
                    message: "No result found!"
                });
            } else {
                console.log(isAdmin);
                res.render('studentsRecord', {
                    admin: isAdmin,
                    title: "List of Users",
                    data: result[0]
                })
            }
        }
    )
}