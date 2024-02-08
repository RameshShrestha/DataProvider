export const setLoggedInUserData= (user,token)=>{
    localStorage.setItem('loggedInUserData', JSON.stringify({user:user,token:token}));
}
export const removeLoggedInUserData =()=>{
    localStorage.removeItem('loggedInUserData');
}
export const getLoggedInUserData =() =>{
    let loggedInUserData =  localStorage.getItemetItem('loggedInUserData');
    if(loggedInUserData){
        loggedInUserData = JSON.parse(loggedInUserData)
    }else{
        return null;
    }
    return loggedInUserData;
}