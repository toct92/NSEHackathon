contract Authority {
    mapping(address => address[]) private accesses;
    mapping (address => mapping (string => string)) private identities;
    
    int public identityPrice;
    address public owner;
    
    function createIdentity()
    {
        //1000000000000000000 = 1 
        //
        
        var etherGot = msg.value;
        
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
    
    function giveAuthorization()
    {
        
    }
    
    function getIdentity()
    {
        
    }
    
    function changeIdentityPrice(int _identityPrice) returns(bool _result)
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
    
    function Authority(int _identityPrice)
    {
        //set the price in wei unit
        identityPrice = _identityPrice;
        owner = msg.sender;
    }
}
