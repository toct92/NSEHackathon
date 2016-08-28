contract Authority {
    mapping(address => address[]) private accesses;
    mapping(address => address[]) private oneTimeAccesses;
    mapping (address => mapping (string => string)) private identities;

    uint256 public identityPrice;
    address public owner;

    function createIdentity() returns(bool _result){
        var etherGot = msg.value;

        if(etherGot == identityPrice){
            identities[msg.sender]["status"] = "Pending";
            return true;
        }
        else if(etherGot > identityPrice){
            var balance = identityPrice - etherGot;
            if(!msg.sender.send(balance)){
              throw;
            }
            identities[msg.sender]["status"] = "Pending";
            return true;
        }
        else{
            return false;
        }

    }

    function processIdentity(address addressOfPerson, string key, string value) returns(bool _result)
    {
        if(owner == msg.sender){
            identities[addressOfPerson][key] = value;
            return true;
        }
        else{
            return false;
        }
    }


    function giveAuthorization(address thirdParty){
      accesses[msg.sender][accesses[msg.sender].length] = thirdParty;
    }

    function deActivateAuthorization(address thirdParty) returns(bool success){
      var thirdPartyAccesses = accesses[msg.sender];
      for(uint256 i = 0; i < thirdPartyAccesses.length; i++){
        if(thirdParty == thirdPartyAccesses[i]){
            accesses[msg.sender] = removeAuthorityAndResetArray(i,thirdPartyAccesses);
            break;
        }
      }
      return true;
    }

    function getIdentity(address user, string key) returns(string result){
      if(msg.sender == user){
        return identities[user][key];
      }
      else{
        var thirdPartyAccesses = accesses[user];
        for(uint256 i = 0; i < thirdPartyAccesses.length; i++){
            if(msg.sender == thirdPartyAccesses[i]){
                return identities[user][key];
            }
        }
      }
    }

    function changeIdentityPrice(uint256 _identityPrice) returns(bool _result){
        if(owner == msg.sender){
            identityPrice = _identityPrice;
            return true;
        }
        else{
            return false;
        }
    }

    function Authority(uint256 _identityPrice){
        //set the price in wei unit
        identityPrice = _identityPrice;
        owner = msg.sender;
    }

    function removeAuthorityAndResetArray(uint index,address[] thirdPartyAccess)  returns(address[]) {
        if (index >= thirdPartyAccess.length) return;

        for (uint i = index; i<thirdPartyAccess.length-1; i++){
            thirdPartyAccess[i] = thirdPartyAccess[i+1];
        }
        delete thirdPartyAccess[thirdPartyAccess.length-1];
        return thirdPartyAccess;
    }
}
