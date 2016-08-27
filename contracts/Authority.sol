contract Authority {
    mapping(address => address[]) private accesses;
    mapping (address => mapping (string => string)) private identities;

    uint256 public identityPrice;
    address public owner;

    function createIdentity() returns(bool _result)
    {
        //1000000000000000000 = 1
        //

        var etherGot = msg.value;

        if(etherGot == identityPrice)
        {
            identities[msg.sender]["status"] = "Pending";
            return true;
        }
        else if(etherGot > identityPrice)
        {
            var balance = identityPrice - etherGot;
            if(!msg.sender.send(balance)){
              throw;
            }
            identities[msg.sender]["status"] = "Pending";
            return true;
        }
        else
        {
            return false;
        }

    }

    function processIdentity(address addressOfPerson, string key, string value) returns(bool _result)
    {
        if(owner == msg.sender)
        {
            identities[addressOfPerson][key] = value;
            return true;
        }
        else
        {
            return false;
        }
    }

    function giveAuthorization(address thirdParty)
    {
        accesses[msg.sender][accesses[msg.sender].length] = thirdParty;
    }

    function getIdentity(address user, string key) returns(string result)
    {
        var apps = accesses[user];

        for(uint256 i = 0; i < apps.length; i++)
        {
            if(msg.sender == apps[i])
            {
                return identities[user][key];
            }
        }
    }

    function changeIdentityPrice(uint256 _identityPrice) returns(bool _result)
    {
        if(owner == msg.sender)
        {

            identityPrice = _identityPrice;
            return true;
        }
        else
        {
            return false;
        }
    }

    function Authority(uint256 _identityPrice)
    {
        //set the price in wei unit
        identityPrice = _identityPrice;
        owner = msg.sender;
    }
}
