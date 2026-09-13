//create
function create(req,res,next){
    res.status(201).json({
        "message":"user created",
        data:{}
    });

}
//read

function list (req, res, next) {
    res.json({
        message:"Users list",
        data:[]

    });
  }

  function find(req,res,next){

    res.json({
        message:"Users by id",
        data:{}

    });




  }

//update
function update(req,res,next){
    res.json({
        message :"user updated",
        data:{}
    });

}


//delete

function destroy(req,res,next){
    res.json({
        message:"User Deleted",
        data:{}
    });

}



  module.exports={list, create,find,update,destroy};