const bcrypt = require('bcrypt-nodejs');
const appModel = require('../../models/dbconnection');
const { check, validationResult } = require('express-validator');
module.exports = {   
    update: async function(req, res, next) {
    	let post = req.body;       
    	if(post && post.submit=='Submit') {
    		//VALIDATE FORM
            await check('email').isEmail().withMessage('Email is required.').run(req);
            await check('phone').isLength({ min: 5 }).withMessage('A valid phone number is required.').run(req);
            let errors = validationResult(req);
            if (errors.isEmpty()) {

                let q = "UPDATE common_settings SET email=?,phone=?  WHERE id=?";
                let placeholderArray = [post.email, post.phone,'1']; 
                appModel.query(q, placeholderArray, function(err, rows) {
                    if(err) {
                       res.render('admin/settings.ejs',{ message: 'Sorry! record not updated. Please try again.',errors: {},username: post.username});
                    }
                    else {
                        req.session.success="Record updated successfully.";
                        res.redirect('/admin/dashboard');
                    }
                });
		    	
		    }
		    else {
		    	res.render('admin/settings.ejs',{ message: '',errors: errors,username: post.username});
		    }
    	}
    	else {
    		res.redirect('/admin/dashboard');
    	}
    },     

    index: function(req, res, next){       
        let sql = 'SELECT * FROM common_settings WHERE `id` = ?';
        let searchArray = ['1']; 
        appModel.query(sql, searchArray, function(err, rows) {
            if(rows) {
                res.render('admin/settings.ejs',{message: '',errors: {},result:rows[0]});
            }
            else {
                res.redirect('/admin/dashboard');
            }      
        });
    },
}; 