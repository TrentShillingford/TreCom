const fs = require("fs")
const express = require('express')
const open = require('open')
const mariadb = require('mariadb')
const upload = require('express-fileupload')
const app = express()
const port = 3000
const html_dir=__dirname.replace("server","client") //replace my path to path/to/src/client
const insert_ = require("./CRUD_Scripts/insert_methods");
const delete_ = require("./CRUD_Scripts/delete_methods");
const read_ = require("./CRUD_Scripts/read_methods");
const update_ = require("./CRUD_Scripts/update_methods");
const get_entry_manager =  require("./entry_manager");
const config = {password: '', user: 'root', host: 'localhost', database:'trecom_db', port: 3306, connectionLimit:0};
const pool = mariadb.createPool(config);
app.use(express.static(html_dir));
app.use(express.static('Profile_Pictures'));
app.use(express.static('User_info'));
app.use(express.json());
app.use(upload());

// The entry manager for the server. This is for purposes of 'hot' lookup
// Creatng two structures for both buyers and suppliers
const supplier_entry_manager = get_entry_manager.retrieve_entry_manager();
const buyer_entry_manager = get_entry_manager.retrieve_entry_manager();
const entry_lookup = {};

async function startup() {
  //grabbing the entries for the profile
  conn_to_suppliers = await pool.query("SELECT * FROM suppliers_table"); //generates a list of objects which are the entries for the buyer/supplier
  conn_to_buyers = await pool.query("SELECT * FROM buyers_table");
  conn_to_users = await pool.query("SELECT * FROM user_profile"); 
  delete conn_to_suppliers.meta;
  delete conn_to_buyers.meta;
  delete conn_to_users.meta;
  //console.log(conn_to_users);
  if (conn_to_users.length > 0){conn_to_users.forEach(element => entry_lookup[element.username] = {});}

  if (conn_to_suppliers.length > 0){conn_to_suppliers.forEach(element => {
    //supplier_entry_manager.add(element);     
    entry_lookup[element.username][element.entry_id] = supplier_entry_manager.add(element);
  });}
  
  if (conn_to_buyers.length > 0){conn_to_buyers.forEach(element => {
    //buyer_entry_manager.add(element);
    entry_lookup[element.username][element.entry_id] = buyer_entry_manager.add(element);
  });}
  
  //console.log(entry_lookup)
  //console.log(supplier_entry_manager)
  console.log('Opening TreCom....');
  open('http://localhost:3000/Home_Page/index.html');
}

app.get('/', (req, res) => {
  //res.send(__dirname)
  //res.sendFile(__dirname + '/client/Registration_Page/Registration_Page.html');
});

app.post('/profile', (request, response) => {
  read_.read_(pool,request.body,response); // Can also send response.json({JSON OBJECT}) to send back a json to the server
  //console.log(request.body);
});

app.post('/register', (request, response) => {

  fs.mkdir("./User_info/" + request.body.Username, function(err) {
    if (err) {
      console.log(err)
    } else {
      console.log("New directory successfully created.")
    }
  });

  insert_.insert_(null,entry_lookup,pool,request,response); // Can also send response.json({JSON OBJECT}) to send back a json to the server
  //console.log(request.body);
});

app.post('/additem', (request, response) => {
  if(request.body.Buyer_or_Supplier == "buyer"){insert_.insert_(buyer_entry_manager,entry_lookup,pool,request,response);}
  if(request.body.Buyer_or_Supplier == "supplier"){insert_.insert_(supplier_entry_manager,entry_lookup,pool,request,response);}
  //can also send response.json({JSON OBJECT}) to send back a json to the server
});

app.post('/updateitem', (request, response) => {
  if(request.body.Buyer_or_Supplier == "buyer"){update_.update_(null,buyer_entry_manager,entry_lookup,pool,request,response);}
  if(request.body.Buyer_or_Supplier == "supplier"){update_.update_(null,supplier_entry_manager,entry_lookup,pool,request,response);}
  //can also send response.json({JSON OBJECT}) to send back a json to the server
});

app.post('/edititem', (request, response) => {
  if(request.body.Buyer_or_Supplier == "buyer"){update_.update_(fs,buyer_entry_manager,entry_lookup,pool,request,response);}
  if(request.body.Buyer_or_Supplier == "supplier"){update_.update_(fs,supplier_entry_manager,entry_lookup,pool,request,response);}
});

app.post('/deleteitem', (request, response) => {
  if(request.body.Buyer_or_Supplier == "buyer"){delete_.delete_(fs,buyer_entry_manager,entry_lookup,pool,request,response);}
  if(request.body.Buyer_or_Supplier == "supplier"){delete_.delete_(fs,supplier_entry_manager,entry_lookup,pool,request,response);}
});

app.post('/login', (request, response) => {
  read_.read_(pool,request.body,response); // Can also send response.json({JSON OBJECT}) to send back a json to the server
  //console.log(request.body + "!!!!flag!!!!");
});

app.post('/suppliers', (request, response) => {
  //read_.read_(pool,request.body,response); // Can also send response.json({JSON OBJECT}) to send back a json to the server
  //console.log(request.body);
  
  switch(request.body.action_item) {

    case "get_suppliers":
      //creating the first page and getting total number of pages
      let supplier_pack = {
        "pagelength": supplier_entry_manager.obj_keys.length.toString(),
        "content": supplier_entry_manager.display(1)
      }
      response.json(supplier_pack);
      break;

    case "page_turn":
      response.json(supplier_entry_manager.display(parseInt(request.body.page_num)));
      break;
      
  }

});

app.post('/buyers', (request, response) => {
  //read_.read_(pool,request.body,response); // Can also send response.json({JSON OBJECT}) to send back a json to the server
  //console.log(request.body);
  
  switch(request.body.action_item) {

    case "get_buyers":
      //creating the first page and getting total number of pages
      let buyer_pack = {
        "pagelength": buyer_entry_manager.obj_keys.length.toString(),
        "content": buyer_entry_manager.display(1)
      }
      response.json(buyer_pack);
      break;

    case "page_turn":
      response.json(buyer_entry_manager.display(parseInt(request.body.page_num)));
      break;
      
  }

});

app.post('/home', (request, response) => {
  //read_.read_(pool,request.body,response); // Can also send response.json({JSON OBJECT}) to send back a json to the server
  //console.log(request.body);

  var tmp_json_buyer = {};
  var tmp_json_supplier = {};

  //Return 15 random items to the featured items list. If there is less than 15, then list all of the items from entry manager
  if(buyer_entry_manager.obj_keys.length < 6){
    //Then list send back all of the entries for listing.
    let i = 1;
    while(i <= buyer_entry_manager.obj_keys.length){

      tmp_obj = buyer_entry_manager.display(i) //object with entry id's as keys

      Object.keys(tmp_obj).forEach(element => tmp_json_buyer[element.toString()] = tmp_obj[element.toString()])

      i += 1;
    }
  }
  else{
    let i = 0;
    let max = buyer_entry_manager.obj_keys.length;
    while(i < buyer_entry_manager.obj_keys.length){

      //Object.keys(buyer_entry_manager[Math.floor(Math.random()*max).toString()]).length
      //['5','44','98','3','2']
      let curr_key = Math.floor(Math.random()*max).toString();
      let entry_id = Object.keys(buyer_entry_manager[curr_key])[Math.floor(Math.random() * Object.keys(buyer_entry_manager[curr_key]).length)].toString();

      if(!(entry_id in tmp_json_buyer)){
        tmp_json_buyer[entry_id] = buyer_entry_manager[curr_key][entry_id]
        i += 1;
      }

      //Math.floor(Math.random() * max); // get a number from 0 to max-1
    }
  }

  //**********************Supplier Entries

  //Return 15 random items to the featured items list. If there is less than 15, then list all of the items from entry manager
  if(supplier_entry_manager.obj_keys.length < 6){
    //Then list send back all of the entries for listing.
    let i = 1;
    while(i <= supplier_entry_manager.obj_keys.length){

      tmp_obj = supplier_entry_manager.display(i) //object with entry id's as keys

      Object.keys(tmp_obj).forEach(element => tmp_json_supplier[element.toString()] = tmp_obj[element.toString()])

      i += 1;

    }
  }
  else{
    let i = 0;
    let max = supplier_entry_manager.obj_keys.length;
    while(i < supplier_entry_manager.obj_keys.length){

      let curr_key = Math.floor(Math.random()*max).toString();
      let entry_id = Object.keys(supplier_entry_manager[curr_key])[Math.floor(Math.random() * Object.keys(supplier_entry_manager[curr_key]).length)].toString();

      if(!(entry_id in tmp_json_supplier)){
        tmp_json_supplier[entry_id] = supplier_entry_manager[curr_key][entry_id]
        i += 1;
      }

      //Math.floor(Math.random() * max); // get a number from 0 to max-1
    }
  }
  
  response.json({
    "buyer": tmp_json_buyer,
    "supplier": tmp_json_supplier
  });

});


app.listen(port, () => {
  //create a startup module
  startup();
});



