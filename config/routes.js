var CryptoJS = require("crypto-js");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/uploads/')
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + "-" + Date.now() + "-" + file.originalname)
    }
});

const storage1 = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/user_uploads')
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + "-" + Date.now() + "-" + file.originalname)
    }
})
const upload = multer({ storage: storage });

const upload1 = multer({ storage: storage1 });

var fileUpload = upload.fields([{ name: 'licence_photo', maxCount: 1 }, { name: 'photo', maxCount: 1 }])
module.exports = function (app) {

    app.use(function (req, res, next) {
        if (req.session.admin_user_id) {
            res.locals.session = req.session;
        } else {
            res.locals.session = "";
        }
        next();
    });
    app.set("title", "Demo App");



    app.get("/", function (req, res) {
        res.send({ Message: "Hello CRM!" });
    });
    app.get("/admin/logout", function (req, res) {
        delete req.session.admin_user_usersmac;
        delete req.session.admin_user_id;
        delete req.session.admin_user_name;
        delete req.session.admin_user_email;
        delete req.session.admin_user_role;
        res.redirect("/admin");
    });

    /*-----------ROUTES FOR ADMIN SECTION---------------*/

    app.get('/admin', require('../controllers/admin/admin').home);
    app.post('/admin', require('../controllers/admin/admin').authenticate);
    app.get('/admin/dashboard', isAdminLoggedIn, require('../controllers/admin/admin').dashboard);
    app.get('/admin/change-admin-password/:id', isAdminLoggedIn, require('../controllers/admin/admin').change_admin_password);
    app.post('/admin/change-admin-password:id', isAdminLoggedIn, require('../controllers/admin/admin').change_admin_password);

    //ADMIN USERS
    app.get('/admin/admin-users', isAdminLoggedIn, require('../controllers/admin/admin').index);
    app.get('/admin/edit-admin/:id/', isAdminLoggedIn, require('../controllers/admin/admin').edit);
    app.post('/admin/edit-admin/:id/', isAdminLoggedIn, require('../controllers/admin/admin').update);
    app.get('/admin/edit-admin/', isAdminLoggedIn, require('../controllers/admin/admin').edit);
    app.post('/admin/edit-admin/', isAdminLoggedIn, require('../controllers/admin/admin').update);
    app.get('/admin/admin-users/delete/:id/', isAdminLoggedIn, require('../controllers/admin/admin').delete);
   
    //SALES AGENTS
    app.get('/admin/users', isAdminLoggedIn, require('../controllers/admin/users').index);
    app.get('/admin/edit-user/:id/', isAdminLoggedIn, require('../controllers/admin/users').edit);
    app.post('/admin/edit-user/:id/', isAdminLoggedIn,fileUpload, require('../controllers/admin/users').update);
    app.get('/admin/edit-user/', isAdminLoggedIn, require('../controllers/admin/users').edit);
    app.post('/admin/edit-user/', isAdminLoggedIn,fileUpload ,require('../controllers/admin/users').update);
    app.get('/admin/users/delete/:id/', isAdminLoggedIn, require('../controllers/admin/users').delete);
    app.post('/admin/users/users-action', isAdminLoggedIn, require('../controllers/admin/users').usersAction);

    //Agent CSV 
    app.get('/admin/add-bulk', isAdminLoggedIn, require('../controllers/admin/usercsv').index);
    app.post('/admin/add-bulk', isAdminLoggedIn, upload1.single('uploadfile'), require('../controllers/admin/usercsv').uploadcsv);

    //CONTACTS
    app.get('/admin/contacts', isAdminLoggedIn, require('../controllers/admin/contact').index);
    app.post('/admin/contact/contact-action', isAdminLoggedIn, require('../controllers/admin/contact').contactAction);
    app.post('/admin/contact/contact-actionfront', require('../controllers/admin/contact').contactAction);

    //OPPORTUNITIES
    app.get('/admin/opportunities', isAdminLoggedIn, require('../controllers/admin/opportunities').index);
    app.get('/admin/edit-opportunities', isAdminLoggedIn, require('../controllers/admin/opportunities').edit);
    app.post('/admin/update-opportunities', isAdminLoggedIn, require('../controllers/admin/opportunities').update);
    app.post('/admin/edit-opportunities', isAdminLoggedIn, require('../controllers/admin/opportunities').update);
    app.post('/admin/opportunities/users-action', isAdminLoggedIn, require('../controllers/admin/opportunities').usersAction);
      
    //STATES
    app.get('/admin/setup/states', isAdminLoggedIn, require('../controllers/admin/states').index);
    app.get('/admin/setup/edit-state/:id/', isAdminLoggedIn, require('../controllers/admin/states').edit);
    app.post('/admin/setup/edit-state/:id/', isAdminLoggedIn, require('../controllers/admin/states').update);
    app.get('/admin/setup/edit-state/', isAdminLoggedIn, require('../controllers/admin/states').edit);
    app.post('/admin/setup/edit-state/', isAdminLoggedIn, require('../controllers/admin/states').update);
    app.get('/admin/setup/states/delete/:id/', isAdminLoggedIn, require('../controllers/admin/states').delete);

    // CAMPAIGN
    app.get('/admin/setup/campaign', isAdminLoggedIn, require('../controllers/admin/campaign').index);
    app.get('/admin/setup/edit-campaign/:id/', isAdminLoggedIn, require('../controllers/admin/campaign').edit);
    app.post('/admin/setup/edit-campaign/:id/', isAdminLoggedIn, require('../controllers/admin/campaign').update);
    app.get('/admin/setup/edit-campaign/', isAdminLoggedIn, require('../controllers/admin/campaign').edit);
    app.post('/admin/setup/edit-campaign/', isAdminLoggedIn, require('../controllers/admin/campaign').update);
    app.get('/admin/setup/campaign/delete/:id', isAdminLoggedIn, require('../controllers/admin/campaign').delete);


    //MESSAGES
    app.get('/admin/setup/messages', isAdminLoggedIn, require('../controllers/admin/messages').index);
    app.get('/admin/setup/edit-messages/:id/', isAdminLoggedIn, require('../controllers/admin/messages').edit);
    app.post('/admin/setup/edit-messages/:id/', isAdminLoggedIn, require('../controllers/admin/messages').update);
    app.get('/admin/setup/edit-messages/', isAdminLoggedIn, require('../controllers/admin/messages').edit);
    app.post('/admin/setup/edit-messages/', isAdminLoggedIn, require('../controllers/admin/messages').update);
    app.get('/admin/setup/messages/delete/:id/', isAdminLoggedIn, require('../controllers/admin/messages').delete);

    //TAGS
    app.get('/admin/setup/tags', isAdminLoggedIn, require('../controllers/admin/tags').index);
    app.get('/admin/setup/edit-tags/:id/', isAdminLoggedIn, require('../controllers/admin/tags').edit);
    app.post('/admin/setup/edit-tags/:id/', isAdminLoggedIn, require('../controllers/admin/tags').update);
    app.get('/admin/setup/edit-tags/', isAdminLoggedIn, require('../controllers/admin/tags').edit);
    app.post('/admin/setup/edit-tags/', isAdminLoggedIn, require('../controllers/admin/tags').update);
    app.get('/admin/setup/tags/delete/:id/', isAdminLoggedIn, require('../controllers/admin/tags').delete);

    //UPLOAD CSV
    app.get('/admin/contacts/uploadcsv', isAdminLoggedIn, require('../controllers/admin/contactcsv').index);
    app.get('/admin/contacts/edit-contact/:id', isAdminLoggedIn, require('../controllers/admin/contactcsv').edit);
    app.post('/admin/contacts/edit-contact/:id', isAdminLoggedIn, require('../controllers/admin/contactcsv').update);
    app.post('/admin/contacts/edit-contactfront/:id', require('../controllers/admin/contactcsv').update);
    app.get('/admin/contacts/edit-contact', isAdminLoggedIn, require('../controllers/admin/contactcsv').edit);
    app.post('/admin/contacts/edit-contact', isAdminLoggedIn, require('../controllers/admin/contactcsv').update);
    app.post('/admin/contacts/uploadcsvdata', isAdminLoggedIn, upload.single('uploadfile'), require('../controllers/admin/contactcsv').uploadcsv);
	app.post('/admin/contacts/checkapp', isAdminLoggedIn, upload.single('uploadfile'), require('../controllers/admin/contactcsv').checkapp);

    //DATATABLE 
    app.get('/admin/admin_users_ajax', isAdminLoggedIn, require('../controllers/admin/datatable').admin_users);
    app.get('/admin/agents_ajax', isAdminLoggedIn, require('../controllers/admin/datatable').agents_ajax);
    app.get('/admin/setup/tag_ajax', isAdminLoggedIn, require('../controllers/admin/datatable').tag_ajax);
    app.get('/admin/setup/campaign_ajax', isAdminLoggedIn, require('../controllers/admin/datatable').campaign_ajax);
    app.get('/admin/setup/state_ajax', isAdminLoggedIn, require('../controllers/admin/datatable').state_ajax);
    app.get('/admin/contact_ajax', isAdminLoggedIn, require('../controllers/admin/datatable').contacts_ajax);
    app.get('/admin/contactagent_ajax', isAdminLoggedIn, require('../controllers/admin/datatable').contactagent_ajax);
    app.get('/admin/setup/message_ajax', isAdminLoggedIn, require('../controllers/admin/datatable').message_ajax);
    app.get('/admin/opportunities_ajax', isAdminLoggedIn, require('../controllers/admin/datatable').opportunities_ajax);
   

    //API
    app.post('/api/agent_login', require('../controllers/api').agent_login);
    app.get('/api/agentId_encrypt/:id',require('../controllers/api').User_verification);
    app.get('/api/agentId/:getAgent_id',require('../controllers/api').getAgent_by_id);
    app.post('/api/update_password/:getAgent_id',require('../controllers/api').updateAgentPassword);
    app.get('/api/update_profile/:id',require('../controllers/api').edit_profile);
    app.get('/api/get_states',require('../controllers/api').get_states);
    app.post('/api/update_profile/:id',upload.any(),require('../controllers/api').update_profile);
     // update_user_profile update Without Upload Image
    app.post('/api/update_user_profile/:id',fileUpload, require('../controllers/api').update_user_profile);
    app.post('/api/getConversations',require('../controllers/api').getConversations);
    app.get('/api/contacts/:userId',require('../controllers/api').getContactByUserId);
    app.post('/api/getConversation_for_one_contact',require('../controllers/api').getConversation_for_one_contact);
    app.post('/api/send_message',require('../controllers/api').send_message);
    app.post('/api/create_opportunity/:agentId',require('../controllers/api').create_opportunity);
    app.post('/api/get_opportunities',require('../controllers/api').get_opportunities);

    app.post('/api/get_single_contact',require('../controllers/api').get_single_contact);
    app.post('/api/get_single_opportunities',require('../controllers/api').get_single_opportunities);
    app.post('/api/create_new_task',require('../controllers/api').create_new_task);
    app.post('/api/list_all_task',require('../controllers/api').list_all_task);
    app.post('/api/list_task_by_contact_id',require('../controllers/api').list_task_by_contact_id);
    app.post('/api/update_follow_up_date',require('../controllers/api').update_follow_up_date);

}

// route middleware to ensure user is logged in
function isAdminLoggedIn(req, res, next) {
    if (!req.session.admin_user_id) {
        res.redirect("/admin");
    } else {
        var usersmac = CryptoJS.HmacMD5(
            req.session.admin_user_id,
            "ilovescotchscotchyscotchscotch"
        ).toString();
        if (usersmac !== req.session.admin_user_usersmac) {
            res.redirect("/admin/logout");
        } else {
            next();
        }
    }
}
