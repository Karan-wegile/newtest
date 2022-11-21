// const bcrypt = require("bcrypt-nodejs");
const CryptoJS = require("crypto-js");
const appModel = require("../../models/dbconnection");
const { check, validationResult } = require("express-validator");

module.exports = {
    index: function (req, res, next) {
        let message = "";
        if (req.session.success) {
            message = req.session.success;
            delete req.session.success;
        }
        let error = "";
        if (req.session.error) {
            error = req.session.error;
            delete req.session.error;
        }
        res.render("admin/campaign.ejs", { success: message, errors: error });
    },

    edit: async function (req, res) {
        let getId = req.params.id;
        var campaign;
        let q = "select * from campaign";
        appModel.query(q, function (err, rows) {
            if (err) {
                throw err;
            } else {
                campaign = rows;
                if (typeof getId !== "undefined") {
                    let qd = "SELECT * FROM campaign WHERE id=?";
                    let placeholder = [getId];
                    appModel.query(qd, placeholder, function (err, rows) {
                        if (rows) {
                            res.render("admin/edit-campaign.ejs", {
                                user_id: getId,
                                message: "",
                                errors: {},
                                result: rows[0],
                            });
                        } else {
                            res.redirect("/admin/setup/campaign");
                        }
                    });
                } else {
                    res.render("admin/edit-campaign.ejs", {
                        user_id: "",
                        message: "",
                        errors: {},
                        result: {},
                        states: campaign,
                    });
                }
            }
        });
    },

    delete: function (req, res, next) {
        let getId = req.params.id;
        if (getId !== "") {
            var qd = "SELECT id FROM campaign WHERE id='" + getId + "'";
            appModel.query(qd, function (err, rows) {
                if (rows) {
                    let qd = "DELETE FROM campaign WHERE id=?";
                    let placeholder = [getId];
                    appModel.query(qd, placeholder, function (err, rows) {
                        if (err) {
                            console.log(err);
                            req.session.error = "Sorry! Campaign not deleted. Please try again";
                            res.redirect("/admin/setup/campaign");
                        } else {
                            req.session.success = "Campaign deleted successfully";
                            res.redirect("/admin/setup/campaign");
                        }
                    });
                }
            });
        } else {
            res.redirect("/admin/setup/campaign");
        }
    },
    update: async function (req, res, next) {
        let getId = req.query.id;
        let post = req.body;


        if (post.status == 'NOT_SELECTED') {
            return res.render("admin/edit-campaign.ejs", {
                user_id: "",
                message: "Please Select Status",
                errors: '',
                result: '',
            });
        };

        let bodyData = {
            campaign_name: post.campaign,
            status: post.status,
            submit: ''
        }

        if (post) {
            if (!getId) {
                if (getId == "") {
                    //VALIDATE FORM
                    await check("campaign")
                        .isLength({ min: 2 })
                        .withMessage("Campaign is required and must be at least 2 chars long.")
                        .run(req);

                    await check("status")
                        .isLength({ min: 1 })
                        .withMessage("Please select status")
                        .run(req);

                    let errors = validationResult(req);
                    if (errors.isEmpty()) {

                        var qd = "SELECT id FROM campaign WHERE campaign_name='" + post.campaign + "'";
                        appModel.query(qd, function (err, rows) {
                            if (rows.length > 0) {
                                res.render("admin/edit-campaign.ejs", {
                                    user_id: "",
                                    message:
                                        "Sorry! Campaign already exists in our database. Please enter another Campaign Name.",
                                    errors: {},
                                    result: bodyData,
                                });
                            } else {
                                let q =
                                    "INSERT INTO campaign SET campaign_name='" + post.campaign + "',status='" + post.status + "' ";

                                appModel.query(q, function (err, rows) {
                                    if (err) {
                                        console.log(err);
                                        res.render("admin/edit-campaign.ejs", {
                                            user_id: "",
                                            message: "Sorry! record not added. Please try again.",
                                            errors: {},
                                            result: bodyData,
                                        });
                                    } else {
                                        req.session.success = "New Campaign Added successfully.";
                                        res.redirect("/admin/setup/campaign");
                                    }
                                });
                            }
                        });
                    } else {
                        res.render("admin/edit-campaign.ejs", {
                            user_id: "",
                            message: "",
                            errors: errors,
                            result: bodyData,
                        });
                    }
                }
            } else {
                if (getId) {
                    //VALIDATE FORM
                    await check("campaign")
                        .isLength({ min: 2 })
                        .withMessage("Campaign is required and must be at least 2 chars long.")
                        .run(req);

                    await check("status")
                        .isLength({ min: 1 })
                        .withMessage("Please select status ")
                        .run(req);

                    let errors = validationResult(req);
                    if (errors.isEmpty()) {
                        //CHECK FOR DUPLICATE
                        let qd = "SELECT * FROM campaign WHERE campaign_name=? AND id !=?";
                        let placeholder = [post.campaign, getId];
                        appModel.query(qd, placeholder, function (err, rows) {
                            if (rows.length > 0) {
                                res.render('admin/edit-campaign.ejs', { user_id: getId, message: 'Sorry! Campaign Name already exists in our database. Please enter another Campaign Name.', errors: {}, result: bodyData });
                            } else {
                                let q =
                                    "UPDATE campaign SET campaign_name='" +
                                    post.campaign +
                                    "', status='" +
                                    post.status +
                                    "' WHERE id='" +
                                    getId +
                                    "' ";

                                appModel.query(q, function (err, rows) {
                                    if (err) {
                                        res.render("admin/edit-campaign.ejs", {
                                            user_id: getId,
                                            message: "Sorry! record not updated. Please try again.",
                                            errors: {},
                                            result: bodyData,
                                        });
                                    } else {
                                        req.session.success = "Campaign updated successfully.";
                                        res.redirect("/admin/setup/campaign");
                                    }
                                });
                            }
                        });
                    } else {
                        
                        res.render("admin/edit-campaign.ejs", {
                            user_id: getId,
                            message: "",
                            errors: errors,
                            result: bodyData,
                        });
                    }
                }
            }
        } else {
            res.redirect("/admin/setup/campaign");
        }
    },
};
