var Web3 = require("web3");

(function() {
  // Planned for future features, logging, etc.
  function Provider(provider) {
    this.provider = provider;
  }

  Provider.prototype.send = function() {
    this.provider.send.apply(this.provider, arguments);
  };

  Provider.prototype.sendAsync = function() {
    this.provider.sendAsync.apply(this.provider, arguments);
  };

  var BigNumber = (new Web3()).toBigNumber(0).constructor;

  var Utils = {
    is_object: function(val) {
      return typeof val == "object" && !Array.isArray(val);
    },
    is_big_number: function(val) {
      if (typeof val != "object") return false;

      // Instanceof won't work because we have multiple versions of Web3.
      try {
        new BigNumber(val);
        return true;
      } catch (e) {
        return false;
      }
    },
    merge: function() {
      var merged = {};
      var args = Array.prototype.slice.call(arguments);

      for (var i = 0; i < args.length; i++) {
        var object = args[i];
        var keys = Object.keys(object);
        for (var j = 0; j < keys.length; j++) {
          var key = keys[j];
          var value = object[key];
          merged[key] = value;
        }
      }

      return merged;
    },
    promisifyFunction: function(fn, C) {
      var self = this;
      return function() {
        var instance = this;

        var args = Array.prototype.slice.call(arguments);
        var tx_params = {};
        var last_arg = args[args.length - 1];

        // It's only tx_params if it's an object and not a BigNumber.
        if (Utils.is_object(last_arg) && !Utils.is_big_number(last_arg)) {
          tx_params = args.pop();
        }

        tx_params = Utils.merge(C.class_defaults, tx_params);

        return new Promise(function(accept, reject) {
          var callback = function(error, result) {
            if (error != null) {
              reject(error);
            } else {
              accept(result);
            }
          };
          args.push(tx_params, callback);
          fn.apply(instance.contract, args);
        });
      };
    },
    synchronizeFunction: function(fn, C) {
      var self = this;
      return function() {
        var args = Array.prototype.slice.call(arguments);
        var tx_params = {};
        var last_arg = args[args.length - 1];

        // It's only tx_params if it's an object and not a BigNumber.
        if (Utils.is_object(last_arg) && !Utils.is_big_number(last_arg)) {
          tx_params = args.pop();
        }

        tx_params = Utils.merge(C.class_defaults, tx_params);

        return new Promise(function(accept, reject) {

          var callback = function(error, tx) {
            if (error != null) {
              reject(error);
              return;
            }

            var timeout = C.synchronization_timeout || 240000;
            var start = new Date().getTime();

            var make_attempt = function() {
              C.web3.eth.getTransactionReceipt(tx, function(err, receipt) {
                if (err) return reject(err);

                if (receipt != null) {
                  return accept(tx, receipt);
                }

                if (timeout > 0 && new Date().getTime() - start > timeout) {
                  return reject(new Error("Transaction " + tx + " wasn't processed in " + (timeout / 1000) + " seconds!"));
                }

                setTimeout(make_attempt, 1000);
              });
            };

            make_attempt();
          };

          args.push(tx_params, callback);
          fn.apply(self, args);
        });
      };
    }
  };

  function instantiate(instance, contract) {
    instance.contract = contract;
    var constructor = instance.constructor;

    // Provision our functions.
    for (var i = 0; i < instance.abi.length; i++) {
      var item = instance.abi[i];
      if (item.type == "function") {
        if (item.constant == true) {
          instance[item.name] = Utils.promisifyFunction(contract[item.name], constructor);
        } else {
          instance[item.name] = Utils.synchronizeFunction(contract[item.name], constructor);
        }

        instance[item.name].call = Utils.promisifyFunction(contract[item.name].call, constructor);
        instance[item.name].sendTransaction = Utils.promisifyFunction(contract[item.name].sendTransaction, constructor);
        instance[item.name].request = contract[item.name].request;
        instance[item.name].estimateGas = Utils.promisifyFunction(contract[item.name].estimateGas, constructor);
      }

      if (item.type == "event") {
        instance[item.name] = contract[item.name];
      }
    }

    instance.allEvents = contract.allEvents;
    instance.address = contract.address;
    instance.transactionHash = contract.transactionHash;
  };

  // Use inheritance to create a clone of this contract,
  // and copy over contract's static functions.
  function mutate(fn) {
    var temp = function Clone() { return fn.apply(this, arguments); };

    Object.keys(fn).forEach(function(key) {
      temp[key] = fn[key];
    });

    temp.prototype = Object.create(fn.prototype);
    bootstrap(temp);
    return temp;
  };

  function bootstrap(fn) {
    fn.web3 = new Web3();
    fn.class_defaults  = fn.prototype.defaults || {};

    // Set the network iniitally to make default data available and re-use code.
    // Then remove the saved network id so the network will be auto-detected on first use.
    fn.setNetwork("default");
    fn.network_id = null;
    return fn;
  };

  // Accepts a contract object created with web3.eth.contract.
  // Optionally, if called without `new`, accepts a network_id and will
  // create a new version of the contract abstraction with that network_id set.
  function Contract() {
    if (this instanceof Contract) {
      instantiate(this, arguments[0]);
    } else {
      var C = mutate(Contract);
      var network_id = arguments.length > 0 ? arguments[0] : "default";
      C.setNetwork(network_id);
      return C;
    }
  };

  Contract.currentProvider = null;

  Contract.setProvider = function(provider) {
    var wrapped = new Provider(provider);
    this.web3.setProvider(wrapped);
    this.currentProvider = provider;
  };

  Contract.new = function() {
    if (this.currentProvider == null) {
      throw new Error("Authority error: Please call setProvider() first before calling new().");
    }

    var args = Array.prototype.slice.call(arguments);

    if (!this.unlinked_binary) {
      throw new Error("Authority error: contract binary not set. Can't deploy new instance.");
    }

    var regex = /__[^_]+_+/g;
    var unlinked_libraries = this.binary.match(regex);

    if (unlinked_libraries != null) {
      unlinked_libraries = unlinked_libraries.map(function(name) {
        // Remove underscores
        return name.replace(/_/g, "");
      }).sort().filter(function(name, index, arr) {
        // Remove duplicates
        if (index + 1 >= arr.length) {
          return true;
        }

        return name != arr[index + 1];
      }).join(", ");

      throw new Error("Authority contains unresolved libraries. You must deploy and link the following libraries before you can deploy a new version of Authority: " + unlinked_libraries);
    }

    var self = this;

    return new Promise(function(accept, reject) {
      var contract_class = self.web3.eth.contract(self.abi);
      var tx_params = {};
      var last_arg = args[args.length - 1];

      // It's only tx_params if it's an object and not a BigNumber.
      if (Utils.is_object(last_arg) && !Utils.is_big_number(last_arg)) {
        tx_params = args.pop();
      }

      tx_params = Utils.merge(self.class_defaults, tx_params);

      if (tx_params.data == null) {
        tx_params.data = self.binary;
      }

      // web3 0.9.0 and above calls new twice this callback twice.
      // Why, I have no idea...
      var intermediary = function(err, web3_instance) {
        if (err != null) {
          reject(err);
          return;
        }

        if (err == null && web3_instance != null && web3_instance.address != null) {
          accept(new self(web3_instance));
        }
      };

      args.push(tx_params, intermediary);
      contract_class.new.apply(contract_class, args);
    });
  };

  Contract.at = function(address) {
    if (address == null || typeof address != "string" || address.length != 42) {
      throw new Error("Invalid address passed to Authority.at(): " + address);
    }

    var contract_class = this.web3.eth.contract(this.abi);
    var contract = contract_class.at(address);

    return new this(contract);
  };

  Contract.deployed = function() {
    if (!this.address) {
      throw new Error("Cannot find deployed address: Authority not deployed or address not set.");
    }

    return this.at(this.address);
  };

  Contract.defaults = function(class_defaults) {
    if (this.class_defaults == null) {
      this.class_defaults = {};
    }

    if (class_defaults == null) {
      class_defaults = {};
    }

    var self = this;
    Object.keys(class_defaults).forEach(function(key) {
      var value = class_defaults[key];
      self.class_defaults[key] = value;
    });

    return this.class_defaults;
  };

  Contract.extend = function() {
    var args = Array.prototype.slice.call(arguments);

    for (var i = 0; i < arguments.length; i++) {
      var object = arguments[i];
      var keys = Object.keys(object);
      for (var j = 0; j < keys.length; j++) {
        var key = keys[j];
        var value = object[key];
        this.prototype[key] = value;
      }
    }
  };

  Contract.all_networks = {
  "default": {
    "abi": [
      {
        "constant": false,
        "inputs": [],
        "name": "createIdentity",
        "outputs": [
          {
            "name": "_result",
            "type": "bool"
          }
        ],
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_identityPrice",
            "type": "uint256"
          }
        ],
        "name": "changeIdentityPrice",
        "outputs": [
          {
            "name": "_result",
            "type": "bool"
          }
        ],
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "owner",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "user",
            "type": "address"
          },
          {
            "name": "key",
            "type": "string"
          }
        ],
        "name": "getIdentity",
        "outputs": [
          {
            "name": "result",
            "type": "string"
          }
        ],
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "thirdParty",
            "type": "address"
          }
        ],
        "name": "deActivateAuthorization",
        "outputs": [
          {
            "name": "success",
            "type": "bool"
          }
        ],
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "thirdParty",
            "type": "address"
          }
        ],
        "name": "giveAuthorization",
        "outputs": [],
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "addressOfPerson",
            "type": "address"
          },
          {
            "name": "key",
            "type": "string"
          },
          {
            "name": "value",
            "type": "string"
          }
        ],
        "name": "processIdentity",
        "outputs": [
          {
            "name": "_result",
            "type": "bool"
          }
        ],
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "index",
            "type": "uint256"
          },
          {
            "name": "thirdPartyAccess",
            "type": "address[]"
          }
        ],
        "name": "removeAuthorityAndResetArray",
        "outputs": [
          {
            "name": "",
            "type": "address[]"
          }
        ],
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "identityPrice",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "type": "function"
      },
      {
        "inputs": [
          {
            "name": "_identityPrice",
            "type": "uint256"
          }
        ],
        "type": "constructor"
      }
    ],
    "unlinked_binary": "0x6060604052604051602080610a9283395060806040525160035560048054600160a060020a03191633179055610a59806100396000396000f3606060405236156100775760e060020a600035046359d21ad9811461007957806368e8d296146101435780638da5cb5b14610171578063ac2d18f714610183578063b9b1cea5146102b9578063ca3261c614610370578063d3c3ffc714610398578063e7c2ca82146104ea578063fc24c6681461054e575b005b61055760035460009034908290821415610652576040805180820182526007815260c860020a6650656e64696e6702602082810191825233600160a060020a031685526002808252845185872060d060020a6573746174757302825260068201529451948590036026019094209251835484875282872094956001821615610100026000190190911604601f908101929092048401939092909183901061068f57805160ff19168380011785555b506106bf9291505b808211156106cb576000815560010161012f565b610557600435600454600090600160a060020a0390811633909116141561077d575060038190556001610781565b61056b600454600160a060020a031681565b604080516020601f60046024803582810135938401859004850286018501909652828552610588958235959294604494919092019181908401838280828437509496505050505050506040805160208101909152600080825280600160a060020a03858116339091161415610786576002600050600086600160a060020a0316815260200190815260200160002060005084604051808280519060200190808383829060006004602084601f0104600302600f01f15090500191505090815260200160405180910390206000508054600181600116156101000203166002900480601f0160208091040260200160405190810160405280929190818152602001828054600181600116156101000203166002900480156108c95780601f1061089e576101008083540402835291602001916108c9565b61055760043533600160a060020a03166000908152602081905260408120815b81548110156108e4578181815481101561000257600091825260209091200154600160a060020a03858116911614156108ee576108f6818380548060200260200160405190810160405280929190818152602001828054801561036657602002820191906000526020600020905b8154600160a060020a0316815260019190910190602001808311610347575b505050505061052e565b61007760043533600160a060020a031660009081526020819052604090208054829190610002565b604080516020601f6004602480358281013593840185900485028601850190965282855261055795823595929460449491909201918190840183828082843750506040805160209735808a0135601f81018a90048a0283018a01909352828252969897606497919650602491909101945090925082915084018382808284375050955493955060009450505050600160a060020a0390811633909116141561099e57816002600050600086600160a060020a0316815260200190815260200160002060005084604051808280519060200190808383829060006004602084601f0104600302600f01f15090500191505090815260200160405180910390206000509080519060200190828054600181600116156101000203166002900490600052602060002090601f016020900481019282601f106109a957805160ff19168380011785555b506109d992915061012f565b6040805160248035600481810135602081810286810182019097528186526105f6968335969395604495019291829190850190849080828437509496505050505050505b60408051602081019091526000808252825184106109e4575b5092915050565b61064060035481565b604080519115158252519081900360200190f35b60408051600160a060020a03929092168252519081900360200190f35b60405180806020018281038252838181518152602001915080519060200190808383829060006004602084601f0104600302600f01f150905090810190601f1680156105e85780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b60405180806020018281038252838181518152602001915080519060200190602002808383829060006004602084601f0104600302600f01f1509050019250505060405180910390f35b60408051918252519081900360200190f35b6003548211156106cf57506040516003548290039033600160a060020a031690600090839082818181858883f1935050505015156106d857610002565b82800160010185558215610127579182015b828111156101275782518260005055916020019190600101906106a1565b5050600192505b505090565b5090565b600092506106c6565b6040805180820182526007815260c860020a6650656e64696e6702602082810191825233600160a060020a031660009081526002808352855186832060d060020a657374617475730282526006820152955195869003602601909520935184548583529183902094956001831615610100026000190190921691909104601f908101929092048401939092909183901061068f57805160ff1916838001178555610127565b5060005b919050565b5050600160a060020a0383166000908152602081905260408120905b81548110156108d1578181815481101561000257600091825260209091200154600160a060020a039081163390911614156108d9576002600050600086600160a060020a0316815260200190815260200160002060005084604051808280519060200190808383829060006004602084601f0104600302600f01f15090500191505090815260200160405180910390206000508054600181600116156101000203166002900480601f0160208091040260200160405190810160405280929190818152602001828054600181600116156101000203166002900480156108c95780601f1061089e576101008083540402835291602001916108c9565b820191906000526020600020905b8154815290600101906020018083116108ac57829003601f168201915b505050505092505b505092915050565b6001016107a2565b50505b5060019392505050565b6001016102d9565b33600160a060020a031660009081526020818152604082208351815481835582855293839020919493820193909201821561096b579160200282015b8281111561096b578251825473ffffffffffffffffffffffffffffffffffffffff19161782556020929092019160019190910190610932565b506108e19291505b808211156106cb57805473ffffffffffffffffffffffffffffffffffffffff19168155600101610973565b5060005b9392505050565b828001600101855582156104de579182015b828111156104de5782518260005055916020019190600101906109bb565b5050600190506109a2565b50825b6001835103811015610a36578281600101815181101561000257906020019060200201518382815181101561000257600160a060020a03929092166020928302909101909101526001016109e7565b82600184510381518110156100025760006020918202909201015282915061054756",
    "updated_at": 1472372722667
  }
};

  Contract.checkNetwork = function(callback) {
    var self = this;

    if (this.network_id != null) {
      return callback();
    }

    this.web3.version.network(function(err, result) {
      if (err) return callback(err);

      var network_id = result.toString();

      // If we have the main network,
      if (network_id == "1") {
        var possible_ids = ["1", "live", "default"];

        for (var i = 0; i < possible_ids.length; i++) {
          var id = possible_ids[i];
          if (Contract.all_networks[id] != null) {
            network_id = id;
            break;
          }
        }
      }

      if (self.all_networks[network_id] == null) {
        return callback(new Error(self.name + " error: Can't find artifacts for network id '" + network_id + "'"));
      }

      self.setNetwork(network_id);
      callback();
    })
  };

  Contract.setNetwork = function(network_id) {
    var network = this.all_networks[network_id] || {};

    this.abi             = this.prototype.abi             = network.abi;
    this.unlinked_binary = this.prototype.unlinked_binary = network.unlinked_binary;
    this.address         = this.prototype.address         = network.address;
    this.updated_at      = this.prototype.updated_at      = network.updated_at;
    this.links           = this.prototype.links           = network.links || {};

    this.network_id = network_id;
  };

  Contract.networks = function() {
    return Object.keys(this.all_networks);
  };

  Contract.link = function(name, address) {
    if (typeof name == "object") {
      Object.keys(name).forEach(function(n) {
        var a = name[n];
        Contract.link(n, a);
      });
      return;
    }

    Contract.links[name] = address;
  };

  Contract.contract_name   = Contract.prototype.contract_name   = "Authority";
  Contract.generated_with  = Contract.prototype.generated_with  = "3.1.2";

  var properties = {
    binary: function() {
      var binary = Contract.unlinked_binary;

      Object.keys(Contract.links).forEach(function(library_name) {
        var library_address = Contract.links[library_name];
        var regex = new RegExp("__" + library_name + "_*", "g");

        binary = binary.replace(regex, library_address.replace("0x", ""));
      });

      return binary;
    }
  };

  Object.keys(properties).forEach(function(key) {
    var getter = properties[key];

    var definition = {};
    definition.enumerable = true;
    definition.configurable = false;
    definition.get = getter;

    Object.defineProperty(Contract, key, definition);
    Object.defineProperty(Contract.prototype, key, definition);
  });

  bootstrap(Contract);

  if (typeof module != "undefined" && typeof module.exports != "undefined") {
    module.exports = Contract;
  } else {
    // There will only be one version of this contract in the browser,
    // and we can use that.
    window.Authority = Contract;
  }
})();
