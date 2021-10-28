module.exports = {

  delete_: async function (fs,ent_man,entry_lookup,pool,request,response) {

    var determine_delete = request.body;

    try{

      //Deletion function
      remove = async () => {

        //if supplier is there, delete picture
        if (determine_delete.Buyer_or_Supplier == "supplier"){
          try{
            fs.unlinkSync('./User_info' + ent_man[last_page_num][determine_delete.entry_id].product_pictures)
          }
          catch(err){
            console.log("no pictures available for product\n");
            console.log(err);
          }
        }

        //delete from entry manager
        delete ent_man[last_page_num][determine_delete.entry_id]

        //delete from entry lookup
        delete entry_lookup[determine_delete.username][determine_delete.entry_id]

        //delete from the database
        conn2 = await pool.query("DELETE FROM " + determine_delete.Buyer_or_Supplier + "s_table WHERE entry_id = ?", [determine_delete.entry_id]);

      }

      ///Delete from entry manager, entry lookup, and database

      /*Check if entry is on the last page, if so, just remove normally with any pictures*/
      var last_page_num = ent_man.obj_keys.length.toString()
      if(entry_lookup[determine_delete.username][determine_delete.entry_id] == last_page_num){ await remove(); }
      else{
        /*If it is not on the last page, then go other route*/

        //Check if the last page is empty; if so, delete and refresh the "last_page_num" variable to new value
        if (Object.keys(ent_man[last_page_num]) == 0){
          delete ent_man[last_page_num]
          ent_man.obj_keys.pop();
          last_page_num = ent_man.obj_keys.length.toString();
        }

        //Check if the item is on new last page 
        if(entry_lookup[determine_delete.username][determine_delete.entry_id] == last_page_num){ await remove(); }
        else{
          //If not on last page, do the switch an entry on last page with the queried one and delete last entry
          ///Performing the switch.
          var reference_pg = entry_lookup[determine_delete.username][determine_delete.entry_id]
          var current_entry = ent_man[reference_pg][determine_delete.entry_id]
          var entry_to_switch = ent_man[last_page_num][Object.keys(ent_man[last_page_num])[0]]

          ent_man[reference_pg][Object.keys(ent_man[last_page_num])[0]] = entry_to_switch; //switching existing element here in manager and lookup
          entry_lookup[entry_to_switch.username][Object.keys(ent_man[last_page_num])[0]] = reference_pg;

          //Deleting the other two entries since we don't need them anymore and anything else.
          //delete ent_man[reference_pg][determine_delete.entry_id]
          delete ent_man[last_page_num][Object.keys(ent_man[last_page_num])[0]]
          last_page_num = reference_pg
          await remove();
          
        }
        
      } 

      response.json({"statusmsg":"db_success"});

    }
    catch(err){
      response.json({"statusmsg":"db_failure"});
      console.log(err);
    }

  }

};

