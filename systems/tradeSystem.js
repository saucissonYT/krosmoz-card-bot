const trades = {}

function createTrade(id,data){
 trades[id]=data
}

function getTrade(id){
 return trades[id]
}

function deleteTrade(id){
 delete trades[id]
}

module.exports={
 createTrade,
 getTrade,
 deleteTrade
}