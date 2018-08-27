// Written by Yinay.M.S
// usable subject to MIT license

JEEPTESTUTILS = {
	// info = {add, style, text}
	CreateDiv: function(info){
		let style = info && info.style;
		let div = document.createElement("div");
		div.style.whiteSpace = "pre-wrap";
		//div.style.lineHeight = "1";
		div.style.margin = "1em";
		div.style.fontFamily = style && style.fontFamily ? style.fontFamily : "courier";
		div.style.fontSize = style && style.fontSize ? style.fontSize : "16px";
		div.style.fontStyle = style && style.fontStyle ? style.fontStyle : "normal";
		if(info && info.text)
			div.textContent = info.text;
		if(info && info.add)
			document.body.appendChild(div);
		return div;
	},
	CreateResultDiv: function(info){
		let div = this.CreateDiv(info);
		div.id = "result";
		document.location.href = "#"+div.id
		return div;
	},
	CreateTimeStamp: function(){
		let d = new Date;
		let t = d.toDateString() + " " + d.toTimeString();
		return this.CreateDiv({add: true, text: t, style: {
			fontSize: "12px",
		}});
	},
	// relevant for fixed sized fonts only
	PadTextRows: function(rows, symCount, sym){
		symCount = symCount || 3;
		sym = sym || ".";
		
		let max = 0;
		for(let k = 0; k<rows.length; k++){
			if(max < rows[k].length)
				max = rows[k].length
		}
		let ret = [];
		for(let k = 0; k<rows.length; k++){
			let diff = max - rows[k].length;
			ret.push(rows[k] + sym.repeat(diff+symCount));
		}
		return ret;
	},
	// info = {map{text, value}, arr[{text, value}], symCount, sym}
	GetFormattedText: function(info){
		let ret = "";
		if(info.map){
			let keys = Object.keys(info.map);
			let padded = this.PadTextRows(keys, info.symCount, info.sym);
			for(let k = 0; k<keys.length; k++)
				ret += padded[k] + info.map[keys[k]] + "\n";
		}
		else if(info.arr){
			let keys = [];
			for(let k = 0; k<info.arr.length; k++)
				keys.push(info.arr[k].text)
			let padded = this.PadTextRows(keys, info.symCount, info.sym);
			for(let k = 0; k<info.arr.length; k++)
				ret += padded[k] + info.arr[k].value + "\n";	
		}
		return ret;
	},
	CreateTable: function(rowNames, columnNames, rowData, cornerText){
		let table = document.createElement("table");
		table.style.borderCollapse = "collapse";

		let tbody = document.createElement("tbody");
		
		let cornerCell = document.createElement("td");
		if(cornerText)
			cornerCell.appendChild(document.createTextNode(cornerText));
		cornerCell.style.border = "1px solid lightgray"
		this.impl.setupTableCell(cornerCell, "corner");

		let header = document.createElement("tr");
		header.appendChild(cornerCell);
		for(let k = 0; k<columnNames.length; k++){
			let headerLabel = document.createElement("td");
			headerLabel.appendChild(document.createTextNode(columnNames[k]));
			this.impl.setupTableCell(headerLabel, "column");
			header.appendChild(headerLabel);
		}
		tbody.appendChild(header);
		
		let rows = [];
		for(let k = 0; k<rowNames.length; k++){
			let row = document.createElement("tr");
			let rowLabel = document.createElement("td");
			rowLabel.appendChild(document.createTextNode(rowNames[k]));
			this.impl.setupTableCell(rowLabel, "row");
			row.appendChild(rowLabel);
			rows.push(row);
			tbody.appendChild(row);
		}

		for(let k = 0; k<rowData.length; k++){
			let row = rows[k];
			let rdata = rowData[k];
			for(let q = 0; q<rdata.length; q++){
				let cell = document.createElement("td");
				cell.appendChild(document.createTextNode(rdata[q]));
				this.impl.setupTableCell(cell, "data");
				row.appendChild(cell);
			}
		}

		table.appendChild(tbody);
		return table;
	},
	impl: {
		setupTableCell: function(cell, type){
			cell.style.border = "1px solid gray"
			cell.style.padding = "2px 5px";
			if(type != "data"){
				cell.style.border = "1px solid gray"
				cell.style.backgroundColor = "lightgray";
				if(type == "corner"){
					cell.style.backgroundColor = "#9ac0da"
				}
			}
		},
	},
}