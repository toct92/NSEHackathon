// function myFunction(x) {
// 	var cell_index = parseInt(x.cellIndex)
//     alert("cell index is: " + cell_index);
//     //alert( this.id);
//     if (cell_index == 6) {

//     }

// }

$(document).ready(function(){
	var id;
	var data=[];
	
	var	column_name= ["Serial No","ID Type","ID Number / Value", "Actions"];
	var heading = "<thead><tr>";
    
	for (i = 0, len = column_name.length; i < len; i++) { 
		heading += "<th>" + column_name[i] +"</th>";
		
	}

	var buttons = "<button class='btn btn-sm btn-warning' id='edit'>Edit</button>&nbsp<button class='btn btn-danger btn-sm' id='del'>Delete</button>";
	var saveButton = "<button class='btn btn-sm btn-success' id='save'>Save</button>";
	var editButton = "<button class='btn btn-sm btn-warning' id='edit'>Edit</button>";
	heading += "</tr></thead>";
	
	$("table").append(heading);

	$("#addRow").click(function(){
		
		var category = document.getElementById("category").value;
		var catDesc = document.getElementById("description").value;
		if(data.length == 0) {
			id = 1;
		}
		else {
			id = data.length+1;
		}
		var datarow = {category : category, description : catDesc};
		
		data.push(datarow);
		//console.log(data[0].firstname);
		var row = "<tr><td>"+id+"</td><td>"+category+"</td><td>"+catDesc+"</td><td>"+buttons+"</td></tr>";
		$("#customrow").append(row);
		document.getElementById("myForm").reset();
		id = id + 1;
		
		/*for(i=0,len = data.length; i < len; i++) { 
		console.log(data[i].firstName);
		}*/

	});

	$("table").on('click',"#del",function() {
		//alert("Yaaaaaa Del is working");
		var par = $(this).parent().parent(); //tr
		var id = par.children("td:nth-child(1)").html();
		var index = parseInt(par.index());
		data.splice(index, 1);
		par.remove();
		debugger;
		for(i=0;i<data.length;i++) {
			$("tbody").children("tr:nth-child("+String(i+1)+")").children("td:nth-child(1)").html(String(i+1));
		}

	});

	$("table").on('click',"#edit",function() {
		//alert("Yaaaaaa edit is working too");
		
		var par = $(this).parent().parent(); //tr
		var tdCategory = par.children("td:nth-child(2)");
		var tdCatDesc = par.children("td:nth-child(3)");




		//alert(tdFirstName.html());

		tdCategory.html("<input type='text' value='"+tdCategory.html()+"'/>");
		tdCatDesc.html("<input type='text' value='"+tdCatDesc.html()+"'/>");

		$(this).replaceWith(saveButton);

	});

	$("table").on('click',"#save",function() {
		//alert("Yaaaaaa edit is working too");
		var par = $(this).parent().parent(); //tr
		var index = par.index();
		

		var tdCategory = par.children("td:nth-child(2)");
		var tdCatDesc = par.children("td:nth-child(3)");
		var id = par.children("td:nth-child(1)").html();
		//debugger;

		data[parseInt(index)].category=tdCategory.children("input[type=text]").val();
		data[parseInt(index)].description=tdCatDesc.children("input[type=text]").val();

		tdCategory.html(tdCategory.children("input[type=text]").val());
		tdCatDesc.html(tdCatDesc.children("input[type=text]").val());

		$(this).replaceWith(editButton);
	});

	$("#submit").click(function(){
		for(i=0,len=data.length;i<len;i++) {
			console.log(data[i].category);
			console.log(data[i].description);
		}
	});

});