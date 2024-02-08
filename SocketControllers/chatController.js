module.exports.respond = function (io, socket) {
    // this function now expects an endpoint as argument
    //state 
    const UsersState = {
        users: [],
        setUsers: function (newUsersArray) {
            this.users = newUsersArray;
            console.log(this.users);
        }
    }
    
  
    // function getAllActiveRooms() {
    //     return Array.from(new Set(UsersState.users.map(user => user.room)))
    // }

}