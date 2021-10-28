//const mariadb = require('mariadb');

module.exports = {
  read_: async function (pool,x,response) {

    //var determine_read = JSON.parse(x);
    var determine_read = x;

    switch(determine_read.action_item) {

      case "login":

        try {

          // query to use here ==> SELECT EXISTS(SELECT * FROM yourTableName WHERE yourCondition);
          conn = await pool.query("SELECT EXISTS(SELECT * FROM user_profile WHERE username=? AND profile_password=BINARY ?)",
          [determine_read.Username, determine_read.Password]);

          console.log(conn['0']);
          
          result = conn['0'][Object.keys(conn['0'])[0]];

          if(result == 1){
            await pool.query("UPDATE user_profile SET online_status = 'online' WHERE username = ?",[determine_read.Username]);
          }

          response.json({statusmsg:result})
          return;

        } 
        catch(err) {
          throw err;
        } 

        break;

      case "get_profile":
        
        var profile_request_pack = {  
          "profile_info":"",
          "entries":""
        };

        try {
          
          //retrieving profile info
          conn = await pool.query("SELECT profile_id,\
          buyer_or_supplier,\
          contact_name,\
          company_name,\
          position_title,\
          management_grade,\
          business_address,\
          business_country,\
          business_size,\
          business_revenue,\
          email_id,\
          phone_id,\
          username,\
          industry FROM user_profile WHERE username=?",
          [determine_read.session_id]); 

          //grabbing the entries for the profile
          conn2 = await pool.query("SELECT * FROM " + conn['0'].buyer_or_supplier + "s_table WHERE profile_id=?",[conn['0'].profile_id]);
          delete conn2.meta;
          
          //Adding the profile info and entries into the profile_request_pack JSON
          profile_request_pack.profile_info = conn['0'];
          profile_request_pack.entries = conn2;
                    
          response.json(profile_request_pack);
          return;

        }
        catch(err) {
          throw err;
        } 

        break;

    }

    return;
        
  }
};


/*pool
   .query("SELECT NOW()")
   .then(rows => {
    console.log(rows); //[ { 'NOW()': 2018-07-02T17:06:38.000Z }, meta: [ ... ] ]
   })
   .catch(err => {
    //handle error
   });*/