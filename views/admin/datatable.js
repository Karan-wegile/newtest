const appModel = require("../../models/dbconnection");
var dateFormat = require("dateformat");

var isset = function (str) {
  if (typeof str != "undefined") {
    return true;
  }
  return false;
};

var trim = function (str) {
  return str.trim();
};

var substr_replace = function (str, replace, start, length) {
  if (start < 0) {
    // start position in str
    start = start + str.length;
  }
  length = length !== undefined ? length : str.length;
  if (length < 0) {
    length = length + str.length - start;
  }
  return (
    str.slice(0, start) +
    replace.substr(0, length) +
    replace.slice(length) +
    str.slice(start + length)
  );
};

var addslashes = function (str) {
  return (str + "").replace(/[\\"']/g, "\\$&").replace(/\u0000/g, "\\0");
};

module.exports = {
  admin_users: function (req, res, next) {
    request = req.query;
    var aColumns = [
      "email",
      "first_name",
      "last_name",
      "createdAt",
      "status",
      "id",
    ];
    var sIndexColumn = "id";
    var sTable = "admin";

    var sLimit = "";
    if (request["start"] && request["length"] != -1) {
      sLimit = "LIMIT " + request["start"] + ", " + request["length"];
    }

    //Ordering
    var sOrder = "ORDER BY id DESC";
    if (
      isset(request["order"]) &&
      isset(request["order"][0]["dir"]) &&
      trim(request["order"][0]["dir"]) !== ""
    ) {
      sOrder =
        "ORDER BY " +
        aColumns[request["order"][0]["column"]] +
        " " +
        request["order"][0]["dir"];
    }

    /*
     * Filtering
     * NOTE this does not match the built-in DataTables filtering which does it
     * word by word on any field. It's possible to do here, but concerned about efficiency
     * on very large tables, and MySQL's regex functionality is very limited
     */

    var sWhere = "";
    if (isset(request["search"]["value"]) && request["search"]["value"] != "") {
      flArray = aColumns;
      sWhere = "WHERE (";
      for (var i = 0; i < flArray.length; i++) {
        sWhere +=
          flArray[i] +
          " LIKE '%" +
          addslashes(request["search"]["value"]) +
          "%' OR ";
      }
      sWhere = substr_replace(sWhere, "", -3);
      sWhere += ")";
    }

    /* Individual column filtering */
    for (i = 0; i < aColumns.length; i++) {
      if (
        isset(request["columns"]) &&
        isset(request["columns"][i]) &&
        request["columns"][i]["searchable"] == "true" &&
        request["columns"][i]["search"]["value"] != ""
      ) {
        if (sWhere == "") {
          sWhere = "WHERE ";
        } else {
          sWhere += " AND ";
        }
        sWhere +=
          aColumns[i] +
          " LIKE '%" +
          addslashes(request["columns"][i]["search"]["value"]) +
          "%' ";
      }
    }

    /*
     * SQL queries
     * Get data to display
     */
    var sQuery =
      "SELECT " +
      aColumns.join(",") +
      " FROM " +
      sTable +
      " " +
      sWhere +
      " " +
      sOrder +
      " " +
      sLimit +
      "";
    var rResult = {};
    var rResultFilterTotal = {};
    var aResultFilterTotal = {};
    var iFilteredTotal = {};
    var iTotal = {};
    var rResultTotal = {};
    var aResultTotal = {};

    appModel.query(sQuery, function (err, rows) {
      if (err) {
        res.send(err);
      } else {
        rResult = rows;
        sQuery =
          "SELECT " +
          aColumns.join(",") +
          " FROM " +
          sTable +
          " " +
          sWhere +
          " " +
          sOrder +
          "";
        appModel.query(sQuery, function (err, rows) {
          if (err) {
            res.send(err);
          } else {
            iFilteredTotal = rows.length;

            sQuery =
              "SELECT COUNT(" +
              sIndexColumn +
              ") as total  FROM " +
              sTable +
              "";
            appModel.query(sQuery, function (err, rows) {
              if (err) {
                res.send(err);
              } else {
                iTotal = rows[0]["total"];
                //Output
                var output = {};
                var temp = [];
                output.sEcho = parseInt(request["sEcho"]);
                output.iTotalRecords = iTotal;
                output.iTotalDisplayRecords = iFilteredTotal;
                output.aaData = [];

                var aRow = rResult;
                var row = [];
                var editUrl = "";
                for (var i in aRow) {
                  for (Field in aRow[i]) {
                    if (Field == "id") {
                      continue;
                    } else if (Field == "createdAt") {
                      var created = dateFormat(
                        aRow[i]["createdAt"],
                        "mmmm dS, yyyy, h:MM:ss TT"
                      );
                      temp.push(created);
                    } else {
                      if (!aRow[i].hasOwnProperty(Field)) continue;
                      temp.push(aRow[i][Field]);
                    }
                  }
                  editUrl =
                    '<a role="button" class="btn btn-primary btn-sm" href="edit-admin/' +
                    aRow[i]["id"] +
                    '" title="Update"><i class="btn-sm fa fa-pencil"></i></a>&nbsp;';
                  editUrl +=
                    '<a role="button" class="btn btn-danger btn-sm" href="admin-users/delete/' +
                    aRow[i]["id"] +
                    '" title="Delete"  onclick="javascript: return confirmDelete();"><i class="fa fa-trash btn-sm"></i></a>';
                  temp.push(editUrl);
                  output.aaData.push(temp);
                  temp = [];
                }
                res.send(output);
              }
            });
          }
        });
      }
    });
  },
 
  invited_ajax: function (req, res, next) {
    request = req.query;
    var aColumns = [
      "id",
      "first_name",
      "last_name",
      "phone_number",
      "email",
      "state",
      "licence_no",
      "licence_expire",
      "status",
      "createdAt",
      "id",
    ];

    var sIndexColumn = "id";
    var sTable = "users";

    var sLimit = "";
    if (request["start"] && request["length"] != -1) {
      sLimit = "LIMIT " + request["start"] + ", " + request["length"];
    }

    //Ordering
    var sOrder = "ORDER BY id DESC";
    if (
      isset(request["order"]) &&
      isset(request["order"][0]["dir"]) &&
      trim(request["order"][0]["dir"]) !== ""
    ) {
      sOrder =
        "ORDER BY " +
        aColumns[request["order"][0]["column"]] +
        " " +
        request["order"][0]["dir"];
    }

    /*
     * Filtering
     * NOTE this does not match the built-in DataTables filtering which does it
     * word by word on any field. It's possible to do here, but concerned about efficiency
     * on very large tables, and MySQL's regex functionality is very limited
     */

    var sWhere = "";
    if (isset(request["search"]["value"]) && request["search"]["value"] != "") {
      flArray = aColumns;
      sWhere = "WHERE (";
      for (var i = 0; i < flArray.length; i++) {
        sWhere +=
          flArray[i] +
          " LIKE '%" +
          addslashes(request["search"]["value"]) +
          "%' OR ";
      }
      sWhere = substr_replace(sWhere, "", -3);
      sWhere += ")";
    }

    /* Individual column filtering */
    for (i = 0; i < aColumns.length; i++) {
      if (
        isset(request["columns"]) &&
        isset(request["columns"][i]) &&
        request["columns"][i]["searchable"] == "true" &&
        request["columns"][i]["search"]["value"] != ""
      ) {
        if (sWhere == "") {
          sWhere = "WHERE ";
        } else {
          sWhere += " AND ";
        }
        sWhere +=
          aColumns[i] +
          " LIKE '%" +
          addslashes(request["columns"][i]["search"]["value"]) +
          "%' ";
      }
    }

    /*
     * SQL queries
     * Get data to display
     */
    var sQuery =
      "SELECT " +
      aColumns.join(",") +
      " FROM " +
      sTable +
      " " +
      sWhere +
      " " +
      sOrder +
      " " +
      sLimit +
      "";
    var rResult = {};
    var rResultFilterTotal = {};
    var aResultFilterTotal = {};
    var iFilteredTotal = {};
    var iTotal = {};
    var rResultTotal = {};
    var aResultTotal = {};

    appModel.query(sQuery, function (err, rows) {
      if (err) {
        res.send(err);
      } else {
        rResult = rows;
        sQuery =
          "SELECT " +
          aColumns.join(",") +
          " FROM " +
          sTable +
          " " +
          sWhere +
          " " +
          sOrder +
          "";
        appModel.query(sQuery, function (err, rows) {
          if (err) {
            res.send(err);
          } else {
            iFilteredTotal = rows.length;

            sQuery =
              "SELECT COUNT(" +
              sIndexColumn +
              ") as total  FROM " +
              sTable +
              "";
            appModel.query(sQuery, function (err, rows) {
              if (err) {
                res.send(err);
              } else {
                iTotal = rows[0]["total"];
                //Output
                var output = {};
                var temp = [];
                output.sEcho = parseInt(request["sEcho"]);
                output.iTotalRecords = iTotal;
                output.iTotalDisplayRecords = iFilteredTotal;
                output.aaData = [];

                var aRow = rResult;
                var row = [];
                var editUrl = "";
                for (var i in aRow) {
                  for (Field in aRow[i]) {
                    if (Field == "id") {
                      temp.push(aRow[i][Field]);
                      continue;
                    } else if (Field == "status") {
                      if (aRow[i][Field] == "0") {
                        temp.push("Invited");
                      } else {
                        temp.push("Active");
                      }
                    } else if (Field == "createdAt") {
                      var created = dateFormat(
                        aRow[i]["createdAt"],
                        "dS, yyyy, h:MM:ss TT"
                      );
                      temp.push(created);
                    } else if (Field == "licence_photo") {
                      if (aRow[i].licence_photo == "") {
                        temp.push("null");
                      }
                      if (aRow[i].licence_photo !== "") {
                        temp.push(aRow[i].licence_photo);
                      }
                    } 
                    // else if (Field == "state") {
                    //   var state_query = `Select * from states`;
                    //   appModel.query(state_query, function (err, rows) {
                    //     myArray = aRow[i].state.split("");
                    //     function arrayRemove(arr, value) {
                    //       return arr.filter(function (ele) {
                    //         return ele != value;
                    //       });
                    //     }
                    //     var result = arrayRemove(myArray, ",");
                    //     newvalue = result.map((id) => ({ id }));
                    //     for (var k in rows) {
                    //       for (var j in newvalue) {
                    //         if (rows[k].id == newvalue[j]) {
                    //           temp.push(aRow[i].licence_photo);
                    //         }
                    //       }
                    //     }
                    //   });
                    // } 
                    else {
                      if (!aRow[i].hasOwnProperty(Field)) continue;
                      temp.push(aRow[i][Field]);
                    }
                  }
                  editUrl =
                    '<a role="button" class="btn btn-primary btn-sm" href="edit-user?id=' +
                    aRow[i]["id"] +
                    '" title="Update"><i class="fa fa-pencil"></i></a>&nbsp;';
                  editUrl +=
                    '<a role="button" class="btn btn-danger btn-sm" href="users/delete/' +
                    aRow[i]["id"] +
                    '" title="Delete"  onclick="javascript: return confirmDelete();"><i class="fa fa-trash btn-sm"></i></a>';
                  temp.push(editUrl);

                  if (temp[temp.length - 3] == "Invited") {
                    output.aaData.push(temp);
                  }
                  temp = [];
                }
                res.send(output);
              }
            });
          }
        });
      }
    });
  },
  agentActive_ajax: function (req, res, next) {
    request = req.query;
    var aColumns = [
      "id",
      "first_name",
      "last_name",
      "phone_number",
      "email",
      "state",
      "licence_no",
      "licence_expire",
      "status",
      "createdAt",
      "id",
    ];
    var sIndexColumn = "id";
    var sTable = "users";

    var sLimit = "";
    if (request["start"] && request["length"] != -1) {
      sLimit = "LIMIT " + request["start"] + ", " + request["length"];
    }

    //Ordering
    var sOrder = "ORDER BY id DESC";
    if (
      isset(request["order"]) &&
      isset(request["order"][0]["dir"]) &&
      trim(request["order"][0]["dir"]) !== ""
    ) {
      sOrder =
        "ORDER BY " +
        aColumns[request["order"][0]["column"]] +
        " " +
        request["order"][0]["dir"];
    }

    /*
     * Filtering
     * NOTE this does not match the built-in DataTables filtering which does it
     * word by word on any field. It's possible to do here, but concerned about efficiency
     * on very large tables, and MySQL's regex functionality is very limited
     */

    var sWhere = "";
    if (isset(request["search"]["value"]) && request["search"]["value"] != "") {
      flArray = aColumns;
      sWhere = "WHERE (";
      for (var i = 0; i < flArray.length; i++) {
        sWhere +=
          flArray[i] +
          " LIKE '%" +
          addslashes(request["search"]["value"]) +
          "%' OR ";
      }
      sWhere = substr_replace(sWhere, "", -3);
      sWhere += ")";
    }

    /* Individual column filtering */
    for (i = 0; i < aColumns.length; i++) {
      if (
        isset(request["columns"]) &&
        isset(request["columns"][i]) &&
        request["columns"][i]["searchable"] == "true" &&
        request["columns"][i]["search"]["value"] != ""
      ) {
        if (sWhere == "") {
          sWhere = "WHERE ";
        } else {
          sWhere += " AND ";
        }
        sWhere +=
          aColumns[i] +
          " LIKE '%" +
          addslashes(request["columns"][i]["search"]["value"]) +
          "%' ";
      }
    }

    /*
     * SQL queries
     * Get data to display
     */
    var sQuery =
      "SELECT " +
      aColumns.join(",") +
      " FROM " +
      sTable +
      " " +
      sWhere +
      " " +
      sOrder +
      " " +
      sLimit +
      "";
    var rResult = {};
    var rResultFilterTotal = {};
    var aResultFilterTotal = {};
    var iFilteredTotal = {};
    var iTotal = {};
    var rResultTotal = {};
    var aResultTotal = {};

    appModel.query(sQuery, function (err, rows) {
      if (err) {
        res.send(err);
      } else {
        rResult = rows;
        sQuery =
          "SELECT " +
          aColumns.join(",") +
          " FROM " +
          sTable +
          " " +
          sWhere +
          " " +
          sOrder +
          "";
        appModel.query(sQuery, function (err, rows) {
          if (err) {
            res.send(err);
          } else {
            iFilteredTotal = rows.length;

            sQuery =
              "SELECT COUNT(" +
              sIndexColumn +
              ") as total  FROM " +
              sTable +
              "";
            appModel.query(sQuery, function (err, rows) {
              if (err) {
                res.send(err);
              } else {
                iTotal = rows[0]["total"];
                //Output
                var output = {};
                var temp = [];
                output.sEcho = parseInt(request["sEcho"]);
                output.iTotalRecords = iTotal;
                output.iTotalDisplayRecords = iFilteredTotal;
                output.aaData = [];

                var aRow = rResult;
                var row = [];
                var editUrl = "";
                for (var i in aRow) {
                  for (Field in aRow[i]) {
                    if (Field == "id") {
                      temp.push(aRow[i][Field]);
                      continue;
                    } else if (Field == "status") {
                      if (aRow[i][Field] == "1") {
                        temp.push("Active");
                      } else {
                        temp.push("Inactive");
                      }
                    } else if (Field == "createdAt") {
                      var created = dateFormat(
                        aRow[i]["createdAt"],
                        "dS, yyyy, h:MM:ss TT"
                      );
                      temp.push(created);
                    }
                    // else if (Field == "photo") {
                    //   if (aRow[i].photo == "") {
                    //     temp.push("null");
                    //   }
                    //   if (aRow[i].photo !== "") {
                    //     temp.push(aRow[i].photo);
                    //   }
                    // }
                    else if (Field == "licence_photo") {
                      if (aRow[i].licence_photo == "") {
                        temp.push("null");
                      }
                      if (aRow[i].licence_photo !== "") {
                        temp.push(aRow[i].licence_photo);
                      }
                    } else {
                      if (!aRow[i].hasOwnProperty(Field)) continue;
                      temp.push(aRow[i][Field]);
                    }
                  }
                  editUrl =
                    '<a role="button" class="btn btn-primary btn-sm" href="edit-user?id=' +
                    aRow[i]["id"] +
                    '" title="Update"><i class="fa fa-pencil"></i></a>&nbsp;';
                  editUrl +=
                    '<a role="button" class="btn btn-danger btn-sm" href="users/delete/' +
                    aRow[i]["id"] +
                    '" title="Delete"  onclick="javascript: return confirmDelete();"><i class="fa fa-trash btn-sm"></i></a>';
                  temp.push(editUrl);

                  if (temp[temp.length - 3] == "Active") {
                    output.aaData.push(temp);
                  }

                  temp = [];
                }
                res.send(output);
              }
            });
          }
        });
      }
    });
  },
  agentArchived_ajax: function (req, res, next) {
    request = req.query;
    var aColumns = [
      "id",
      "first_name",
      "last_name",
      "phone_number",
      "email",
      "state",
      "licence_no",
      "licence_expire",
      "status",
      "createdAt",
      "id",
    ];
    var sIndexColumn = "id";
    var sTable = "users";

    var sLimit = "";
    if (request["start"] && request["length"] != -1) {
      sLimit = "LIMIT " + request["start"] + ", " + request["length"];
    }

    //Ordering
    var sOrder = "ORDER BY id DESC";
    if (
      isset(request["order"]) &&
      isset(request["order"][0]["dir"]) &&
      trim(request["order"][0]["dir"]) !== ""
    ) {
      sOrder =
        "ORDER BY " +
        aColumns[request["order"][0]["column"]] +
        " " +
        request["order"][0]["dir"];
    }

    /*
     * Filtering
     * NOTE this does not match the built-in DataTables filtering which does it
     * word by word on any field. It's possible to do here, but concerned about efficiency
     * on very large tables, and MySQL's regex functionality is very limited
     */

    var sWhere = "";
    if (isset(request["search"]["value"]) && request["search"]["value"] != "") {
      flArray = aColumns;
      sWhere = "WHERE (";
      for (var i = 0; i < flArray.length; i++) {
        sWhere +=
          flArray[i] +
          " LIKE '%" +
          addslashes(request["search"]["value"]) +
          "%' OR ";
      }
      sWhere = substr_replace(sWhere, "", -3);
      sWhere += ")";
    }

    /* Individual column filtering */
    for (i = 0; i < aColumns.length; i++) {
      if (
        isset(request["columns"]) &&
        isset(request["columns"][i]) &&
        request["columns"][i]["searchable"] == "true" &&
        request["columns"][i]["search"]["value"] != ""
      ) {
        if (sWhere == "") {
          sWhere = "WHERE ";
        } else {
          sWhere += " AND ";
        }
        sWhere +=
          aColumns[i] +
          " LIKE '%" +
          addslashes(request["columns"][i]["search"]["value"]) +
          "%' ";
      }
    }

    /*
     * SQL queries
     * Get data to display
     */
    var sQuery =
      "SELECT " +
      aColumns.join(",") +
      " FROM " +
      sTable +
      " " +
      sWhere +
      " " +
      sOrder +
      " " +
      sLimit +
      "";
    var rResult = {};
    var rResultFilterTotal = {};
    var aResultFilterTotal = {};
    var iFilteredTotal = {};
    var iTotal = {};
    var rResultTotal = {};
    var aResultTotal = {};

    appModel.query(sQuery, function (err, rows) {
      if (err) {
        res.send(err);
      } else {
        rResult = rows;
        sQuery =
          "SELECT " +
          aColumns.join(",") +
          " FROM " +
          sTable +
          " " +
          sWhere +
          " " +
          sOrder +
          "";
        appModel.query(sQuery, function (err, rows) {
          if (err) {
            res.send(err);
          } else {
            iFilteredTotal = rows.length;

            sQuery =
              "SELECT COUNT(" +
              sIndexColumn +
              ") as total  FROM " +
              sTable +
              "";
            appModel.query(sQuery, function (err, rows) {
              if (err) {
                res.send(err);
              } else {
                iTotal = rows[0]["total"];
                //Output
                var output = {};
                var temp = [];
                output.sEcho = parseInt(request["sEcho"]);
                output.iTotalRecords = iTotal;
                output.iTotalDisplayRecords = iFilteredTotal;
                output.aaData = [];

                var aRow = rResult;
                var row = [];
                var editUrl = "";
                for (var i in aRow) {
                  for (Field in aRow[i]) {
                    if (Field == "id") {
                      temp.push(aRow[i][Field]);
                      continue;
                    } else if (Field == "status") {
                      if (aRow[i][Field] == "2") {
                        temp.push("Archived");
                      } else {
                        temp.push("Active");
                      }
                    } else if (Field == "createdAt") {
                      var created = dateFormat(
                        aRow[i]["createdAt"],
                        "dS, yyyy, h:MM:ss TT"
                      );
                      temp.push(created);
                    }
                    // else if (Field == "photo") {
                    //   if (aRow[i].photo == "") {
                    //     temp.push("null");
                    //   }
                    //   if (aRow[i].photo !== "") {
                    //     temp.push(aRow[i].photo);
                    //   }
                    // }
                    else if (Field == "licence_photo") {
                      if (aRow[i].licence_photo == "") {
                        temp.push("null");
                      }
                      if (aRow[i].licence_photo !== "") {
                        temp.push(aRow[i].licence_photo);
                      }
                    } else {
                      if (!aRow[i].hasOwnProperty(Field)) continue;
                      temp.push(aRow[i][Field]);
                    }
                  }
                  editUrl =
                    '<a role="button" class="btn btn-primary btn-sm" href="edit-user?id=' +
                    aRow[i]["id"] +
                    '" title="Update"><i class="fa fa-pencil"></i></a>&nbsp;';
                  editUrl +=
                    '<a role="button" class="btn btn-danger btn-sm" href="users/delete/' +
                    aRow[i]["id"] +
                    '" title="Delete"  onclick="javascript: return confirmDelete();"><i class="fa fa-trash btn-sm"></i></a>';
                  temp.push(editUrl);

                  if (temp[temp.length - 3] == "Archived") {
                    output.aaData.push(temp);
                  }
                  temp = [];
                }
                res.send(output);
              }
            });
          }
        });
      }
    });
  },

  state_ajax: function (req, res, next) {
    request = req.query;
    var aColumns = ["name", "abbrevation", "id"];
    var sIndexColumn = "id";
    var sTable = "states";

    var sLimit = "";
    if (request["start"] && request["length"] != -1) {
      sLimit = "LIMIT " + request["start"] + ", " + request["length"];
    }

    //Ordering
    var sOrder = "ORDER BY id DESC";
    if (
      isset(request["order"]) &&
      isset(request["order"][0]["dir"]) &&
      trim(request["order"][0]["dir"]) !== ""
    ) {
      sOrder =
        "ORDER BY " +
        aColumns[request["order"][0]["column"]] +
        " " +
        request["order"][0]["dir"];
    }

    /*
     * Filtering
     * NOTE this does not match the built-in DataTables filtering which does it
     * word by word on any field. It's possible to do here, but concerned about efficiency
     * on very large tables, and MySQL's regex functionality is very limited
     */

    var sWhere = "";
    if (isset(request["search"]["value"]) && request["search"]["value"] != "") {
      flArray = aColumns;
      sWhere = "WHERE (";
      for (var i = 0; i < flArray.length; i++) {
        sWhere +=
          flArray[i] +
          " LIKE '%" +
          addslashes(request["search"]["value"]) +
          "%' OR ";
      }
      sWhere = substr_replace(sWhere, "", -3);
      sWhere += ")";
    }

    /* Individual column filtering */
    for (i = 0; i < aColumns.length; i++) {
      if (
        isset(request["columns"]) &&
        isset(request["columns"][i]) &&
        request["columns"][i]["searchable"] == "true" &&
        request["columns"][i]["search"]["value"] != ""
      ) {
        if (sWhere == "") {
          sWhere = "WHERE ";
        } else {
          sWhere += " AND ";
        }
        sWhere +=
          aColumns[i] +
          " LIKE '%" +
          addslashes(request["columns"][i]["search"]["value"]) +
          "%' ";
      }
    }

    /*
     * SQL queries
     * Get data to display
     */
    var sQuery =
      "SELECT " +
      aColumns.join(",") +
      " FROM " +
      sTable +
      " " +
      sWhere +
      " " +
      sOrder +
      " " +
      sLimit +
      "";
    var rResult = {};
    var rResultFilterTotal = {};
    var aResultFilterTotal = {};
    var iFilteredTotal = {};
    var iTotal = {};
    var rResultTotal = {};
    var aResultTotal = {};

    appModel.query(sQuery, function (err, rows) {
      if (err) {
        res.send(err);
      } else {
        rResult = rows;
        sQuery =
          "SELECT " +
          aColumns.join(",") +
          " FROM " +
          sTable +
          " " +
          sWhere +
          " " +
          sOrder +
          "";
        appModel.query(sQuery, function (err, rows) {
          if (err) {
            res.send(err);
          } else {
            iFilteredTotal = rows.length;

            sQuery =
              "SELECT COUNT(" +
              sIndexColumn +
              ") as total  FROM " +
              sTable +
              "";
            appModel.query(sQuery, function (err, rows) {
              if (err) {
                res.send(err);
              } else {
                iTotal = rows[0]["total"];
                //Output
                var output = {};
                var temp = [];
                output.sEcho = parseInt(request["sEcho"]);
                output.iTotalRecords = iTotal;
                output.iTotalDisplayRecords = iFilteredTotal;
                output.aaData = [];

                var aRow = rResult;
                var row = [];
                var editUrl = "";
                for (var i in aRow) {
                  for (Field in aRow[i]) {
                    if (Field == "id") {
                      continue;
                    } else if (Field == "createdAt") {
                      var created = dateFormat(
                        aRow[i]["createdAt"],
                        "dS, yyyy, h:MM:ss TT"
                      );
                      temp.push(created);
                    } else {
                      if (!aRow[i].hasOwnProperty(Field)) continue;
                      temp.push(aRow[i][Field]);
                    }
                  }
                  // editUrl = '<a href="edit-contact/' + aRow[i]['id'] + '" title="Update"><i class="btn btn-primary btn-sm fa fa-pencil"></i></a>&nbsp;';
                  // editUrl += '<a href="contacts_ajas/delete/' + aRow[i]['id'] + '" title="Delete"  onclick="javascript: return confirmDelete();"><i class="btn btn-danger fa fa-trash btn-sm"></i></a>';
                  // temp.push(editUrl);
                  output.aaData.push(temp);
                  temp = [];
                }
                res.send(output);
              }
            });
          }
        });
      }
    });
  },

  contacts_ajax: function (req, res, next) {
    request = req.query;
    var aColumns = [
      "id",
      "first_name",
      "last_name",
      "phone_number",
      "email",
      "address",
      "state",
      "campaign",
      "created",
      "status",
      "contact_type",
    ];
    var sIndexColumn = "id";
    var sTable = "contacts";

    var sLimit = "";
    if (request["start"] && request["length"] != -1) {
      sLimit = "LIMIT " + request["start"] + ", " + request["length"];
    }

    //Ordering
    var sOrder = "ORDER BY id DESC";
    if (
      isset(request["order"]) &&
      isset(request["order"][0]["dir"]) &&
      trim(request["order"][0]["dir"]) !== ""
    ) {
      sOrder =
        "ORDER BY " +
        aColumns[request["order"][0]["column"]] +
        " " +
        request["order"][0]["dir"];
    }

    /*
     * Filtering
     * NOTE this does not match the built-in DataTables filtering which does it
     * word by word on any field. It's possible to do here, but concerned about efficiency
     * on very large tables, and MySQL's regex functionality is very limited
     */

    var sWhere = "";
    if (isset(request["search"]["value"]) && request["search"]["value"] != "") {
      flArray = aColumns;
      sWhere = "WHERE (";
      for (var i = 0; i < flArray.length; i++) {
        sWhere +=
          flArray[i] +
          " LIKE '%" +
          addslashes(request["search"]["value"]) +
          "%' OR ";
      }
      sWhere = substr_replace(sWhere, "", -3);
      sWhere += ")";
    }

    / Individual column filtering /;
    for (i = 0; i < aColumns.length; i++) {
      if (
        isset(request["columns"]) &&
        isset(request["columns"][i]) &&
        request["columns"][i]["searchable"] == "true" &&
        request["columns"][i]["search"]["value"] != ""
      ) {
        if (sWhere == "") {
          sWhere = "WHERE ";
        } else {
          sWhere += " AND ";
        }
        sWhere +=
          aColumns[i] +
          " LIKE '%" +
          addslashes(request["columns"][i]["search"]["value"]) +
          "%' ";
      }
    }

    /*
     * SQL queries
     * Get data to display
     */
    var sQuery =
      "SELECT " +
      aColumns.join(",") +
      " FROM " +
      sTable +
      " " +
      sWhere +
      " " +
      sOrder +
      " " +
      sLimit +
      "";
    var rResult = {};
    var rResultFilterTotal = {};
    var aResultFilterTotal = {};
    var iFilteredTotal = {};
    var iTotal = {};
    var rResultTotal = {};
    var aResultTotal = {};

    appModel.query(sQuery, function (err, rows) {
      if (err) {
        res.send(err);
      } else {
        rResult = rows;
        sQuery =
          "SELECT " +
          aColumns.join(",") +
          " FROM " +
          sTable +
          " " +
          sWhere +
          " " +
          sOrder +
          "";
        appModel.query(sQuery, function (err, rows) {
          if (err) {
            res.send(err);
          } else {
            iFilteredTotal = rows.length;

            sQuery =
              "SELECT COUNT(" +
              sIndexColumn +
              ") as total  FROM " +
              sTable +
              "";
            appModel.query(sQuery, function (err, rows) {
              if (err) {
                res.send(err);
              } else {
                iTotal = rows[0]["total"];
                //Output
                var output = {};
                var temp = [];
                output.sEcho = parseInt(request["sEcho"]);
                output.iTotalRecords = iTotal;
                output.iTotalDisplayRecords = iFilteredTotal;
                output.aaData = [];

                var aRow = rResult;
                var row = [];
                var editUrl = "";
                var chekcedbox = '';
                for (var i in aRow) {
                  chekcedbox = '<input class="allCheck form-check-input border-blue form-custom-check" type="checkbox" value=""> ';
                  temp.push(chekcedbox);
                  for (Field in aRow[i]) {
                    if (Field == "status") {
                      if (aRow[i][Field] == "1") {
                        temp.push("Active");
                      } else {
                        temp.push("Unassigned");
                      }
                    } else if (Field == "created") {
                      var created = dateFormat(
                        aRow[i]["created"],
                        "dS, yyyy, h:MM:ss TT"
                      );
                      temp.push(created);
                    } else {
                      if (!aRow[i].hasOwnProperty(Field)) continue;
                      temp.push(aRow[i][Field]);
                    }
                  }
                  // editUrl = '<a href="edit-contact/' + aRow[i]['id'] + '" title="Update"><i class="btn btn-primary btn-sm fa fa-pencil"></i></a>&nbsp;';
                  // editUrl += '<a href="contacts_ajas/delete/' + aRow[i]['id'] + '" title="Delete"  onclick="javascript: return confirmDelete();"><i class="btn btn-danger fa fa-trash btn-sm"></i></a>';
                  // temp.push(editUrl);
                  if (temp[temp.length - 1] == "0") {
                    output.aaData.push(temp);
                  }
                  temp = [];
                }
                res.send(output);
              }
            });
          }
        });
      }
    });
  },

  contacts_assign_ajax: function (req, res, next) {
    request = req.query;
    var aColumns = [
      "id",
      "first_name",
      "last_name",
      "phone_number",
      "email",
      "address",
      "state",
      "user_fid",
      "campaign",
      "created",
      "status",
      "contact_type",
    ];
    var sIndexColumn = "id";
    var sTable = "contacts";

    var sLimit = "";
    if (request["start"] && request["length"] != -1) {
      sLimit = "LIMIT " + request["start"] + ", " + request["length"];
    }

    //Ordering
    var sOrder = "ORDER BY id DESC";
    if (
      isset(request["order"]) &&
      isset(request["order"][0]["dir"]) &&
      trim(request["order"][0]["dir"]) !== ""
    ) {
      sOrder =
        "ORDER BY " +
        aColumns[request["order"][0]["column"]] +
        " " +
        request["order"][0]["dir"];
    }

    /*
     * Filtering
     * NOTE this does not match the built-in DataTables filtering which does it
     * word by word on any field. It's possible to do here, but concerned about efficiency
     * on very large tables, and MySQL's regex functionality is very limited
     */

    var sWhere = "";
    if (isset(request["search"]["value"]) && request["search"]["value"] != "") {
      flArray = aColumns;
      sWhere = "WHERE (";
      for (var i = 0; i < flArray.length; i++) {
        sWhere +=
          flArray[i] +
          " LIKE '%" +
          addslashes(request["search"]["value"]) +
          "%' OR ";
      }
      sWhere = substr_replace(sWhere, "", -3);
      sWhere += ")";
    }

    / Individual column filtering /;
    for (i = 0; i < aColumns.length; i++) {
      if (
        isset(request["columns"]) &&
        isset(request["columns"][i]) &&
        request["columns"][i]["searchable"] == "true" &&
        request["columns"][i]["search"]["value"] != ""
      ) {
        if (sWhere == "") {
          sWhere = "WHERE ";
        } else {
          sWhere += " AND ";
        }
        sWhere +=
          aColumns[i] +
          " LIKE '%" +
          addslashes(request["columns"][i]["search"]["value"]) +
          "%' ";
      }
    }

    /*
     * SQL queries
     * Get data to display
     */
    var sQuery =
      "SELECT " +
      aColumns.join(",") +
      " FROM " +
      sTable +
      " " +
      sWhere +
      " " +
      sOrder +
      " " +
      sLimit +
      "";
    var rResult = {};
    var rResultFilterTotal = {};
    var aResultFilterTotal = {};
    var iFilteredTotal = {};
    var iTotal = {};
    var rResultTotal = {};
    var aResultTotal = {};

    appModel.query(sQuery, function (err, rows) {
      if (err) {
        res.send(err);
      } else {
        rResult = rows;
        sQuery =
          "SELECT " +
          aColumns.join(",") +
          " FROM " +
          sTable +
          " " +
          sWhere +
          " " +
          sOrder +
          "";
        appModel.query(sQuery, function (err, rows) {
          if (err) {
            res.send(err);
          } else {
            iFilteredTotal = rows.length;
            sQuery =
              "SELECT COUNT(" +
              sIndexColumn +
              ") as total  FROM " +
              sTable +
              "";
            appModel.query(sQuery, function (err, rows) {
              if (err) {
                res.send(err);
              } else {
                iTotal = rows[0]["total"];
                //Output
                var output = {};
                var temp = [];
                output.sEcho = parseInt(request["sEcho"]);
                output.iTotalRecords = iTotal;
                output.iTotalDisplayRecords = iFilteredTotal;
                output.aaData = [];

                var aRow = rResult;
                var row = [];
                var editUrl = "";
                var chekcedbox = '';
                for (var i in aRow) {
                  chekcedbox = '<input class="allCheck form-check-input border-blue form-custom-check" type="checkbox" value=""> ';
                  temp.push(chekcedbox);
                  for (Field in aRow[i]) {
                    if (Field == "status") {
                      if (aRow[i][Field] == "1") {
                        temp.push("Active");
                      } else {
                        temp.push("Inactive");
                      }
                    } else if (Field == "user_fid") {
                      if (aRow[i][Field] == null) {
                        temp.push("No Agent");
                        continue;
                      } else {
                        var users_id = aRow[i][Field];
                        temp.push(users_id);
                      }
                    } else if (Field == "created") {
                      var created = dateFormat(
                        aRow[i]["created"],
                        "dS, yyyy, h:MM:ss TT"
                      );
                      temp.push(created);
                    } else {
                      if (!aRow[i].hasOwnProperty(Field)) continue;
                      temp.push(aRow[i][Field]);
                    }
                  }
                  // editUrl = '<a href="edit-contact/' + aRow[i]['id'] + '" title="Update"><i class="btn btn-primary btn-sm fa fa-pencil"></i></a>&nbsp;';
                  // editUrl += '<a href="contacts_ajas/delete/' + aRow[i]['id'] + '" title="Delete"  onclick="javascript: return confirmDelete();"><i class="btn btn-danger fa fa-trash btn-sm"></i></a>';
                  // temp.push(editUrl);
                  if (temp[temp.length - 1] == "1") {
                    output.aaData.push(temp);
                  }
                  temp = [];
                }
                res.send(output);
              }
            });
          }
        });
      }
    });
  },

  contacts_dnd_ajax: function (req, res, next) {
    request = req.query;
    var aColumns = [
      "id",
      "first_name",
      "last_name",
      "phone_number",
      "email",
      "address",
      "state",
      "campaign",
      "created",
      "status",
      "contact_type",
    ];
    var sIndexColumn = "id";
    var sTable = "contacts";

    var sLimit = "";
    if (request["start"] && request["length"] != -1) {
      sLimit = "LIMIT " + request["start"] + ", " + request["length"];
    }

    //Ordering
    var sOrder = "ORDER BY id DESC";
    if (
      isset(request["order"]) &&
      isset(request["order"][0]["dir"]) &&
      trim(request["order"][0]["dir"]) !== ""
    ) {
      sOrder =
        "ORDER BY " +
        aColumns[request["order"][0]["column"]] +
        " " +
        request["order"][0]["dir"];
    }

    /*
     * Filtering
     * NOTE this does not match the built-in DataTables filtering which does it
     * word by word on any field. It's possible to do here, but concerned about efficiency
     * on very large tables, and MySQL's regex functionality is very limited
     */

    var sWhere = "";
    if (isset(request["search"]["value"]) && request["search"]["value"] != "") {
      flArray = aColumns;
      sWhere = "WHERE (";
      for (var i = 0; i < flArray.length; i++) {
        sWhere +=
          flArray[i] +
          " LIKE '%" +
          addslashes(request["search"]["value"]) +
          "%' OR ";
      }
      sWhere = substr_replace(sWhere, "", -3);
      sWhere += ")";
    }

    / Individual column filtering /;
    for (i = 0; i < aColumns.length; i++) {
      if (
        isset(request["columns"]) &&
        isset(request["columns"][i]) &&
        request["columns"][i]["searchable"] == "true" &&
        request["columns"][i]["search"]["value"] != ""
      ) {
        if (sWhere == "") {
          sWhere = "WHERE ";
        } else {
          sWhere += " AND ";
        }
        sWhere +=
          aColumns[i] +
          " LIKE '%" +
          addslashes(request["columns"][i]["search"]["value"]) +
          "%' ";
      }
    }

    /*
     * SQL queries
     * Get data to display
     */
    var sQuery =
      "SELECT " +
      aColumns.join(",") +
      " FROM " +
      sTable +
      " " +
      sWhere +
      " " +
      sOrder +
      " " +
      sLimit +
      "";
    var rResult = {};
    var rResultFilterTotal = {};
    var aResultFilterTotal = {};
    var iFilteredTotal = {};
    var iTotal = {};
    var rResultTotal = {};
    var aResultTotal = {};

    appModel.query(sQuery, function (err, rows) {
      if (err) {
        res.send(err);
      } else {
        rResult = rows;
        sQuery =
          "SELECT " +
          aColumns.join(",") +
          " FROM " +
          sTable +
          " " +
          sWhere +
          " " +
          sOrder +
          "";
        appModel.query(sQuery, function (err, rows) {
          if (err) {
            res.send(err);
          } else {
            iFilteredTotal = rows.length;

            sQuery =
              "SELECT COUNT(" +
              sIndexColumn +
              ") as total  FROM " +
              sTable +
              "";
            appModel.query(sQuery, function (err, rows) {
              if (err) {
                res.send(err);
              } else {
                iTotal = rows[0]["total"];
                //Output
                var output = {};
                var temp = [];
                output.sEcho = parseInt(request["sEcho"]);
                output.iTotalRecords = iTotal;
                output.iTotalDisplayRecords = iFilteredTotal;
                output.aaData = [];

                var aRow = rResult;
                var row = [];
                var editUrl = "";
                var chekcedbox = '';
                for (var i in aRow) {
                  chekcedbox = '<input class="allCheck form-check-input border-blue form-custom-check" type="checkbox" value=""> ';
                  temp.push(chekcedbox);
                  for (Field in aRow[i]) {
                    if (Field == "status") {
                      if (aRow[i][Field] == "1") {
                        temp.push("Active");
                      } else {
                        temp.push("Unassigned");
                      }
                    } else if (Field == "created") {
                      var created = dateFormat(
                        aRow[i]["created"],
                        "dS, yyyy, h:MM:ss TT"
                      );
                      temp.push(created);
                    } else {
                      if (!aRow[i].hasOwnProperty(Field)) continue;
                      temp.push(aRow[i][Field]);
                    }
                  }
                  // editUrl = '<a href="edit-contact/' + aRow[i]['id'] + '" title="Update"><i class="btn btn-primary btn-sm fa fa-pencil"></i></a>&nbsp;';
                  // editUrl += '<a href="contacts_ajas/delete/' + aRow[i]['id'] + '" title="Delete"  onclick="javascript: return confirmDelete();"><i class="btn btn-danger fa fa-trash btn-sm"></i></a>';
                  // temp.push(editUrl);
                  if (temp[temp.length - 1] == "2") {
                    output.aaData.push(temp);
                  }
                  temp = [];
                }
                res.send(output);
              }
            });
          }
        });
      }
    });
  },
};
