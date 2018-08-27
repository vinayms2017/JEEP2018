/*
 --------------------------------------------------------------------
 Designed and Developed by Vinay.M.S
 --------------------------------------------------------------------

 An extremely simple testing utility. This can be (and is) used to build
 more elaborate mechanisms. 

 Usage is quite simple. 
 
 1. Initialize the Tester mechanism by calling Tester.Init
 2. Create a case with name, description, aspects and expected results by calling Tester.NewCase
 3. From within the test code, add generated results to the case by calling Case.AddGenerated
 4. When test code finishes run the test by calling Case.Compare
 5. Optionally add the aspects browser by calling Tester.CreateAspectsBrowser
 6. The same case can be reused by calling Case.Reset.
 
 Coding convention:
		names beginning with lower case are private
		names beginning with upper case are public
 
 This class is usable subject to MIT license.
 --------------------------------------------------------------------
 The MIT License (MIT) http://opensource.org/licenses/MIT
 
 Copyright (c) 2017 Vinay.M.S
 
 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:
 
 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.
 
 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 -------------------------------------------------------------------
 */
Tester = {
	Init: function(){
		this.counter = 0;
		this.aspmap = {};
		this.aspComboMap = {};
	},
	NewCase: function(test){
		return new Tester.Case;
	},
	CreateAspectsBrowser: function(resdiv){
		return CreateAspectsUI(resdiv);
	},
	// failedTests = [{name, id}]
	CreateFailList: function(failedTests, addNavig){
		let list = document.createElement("ol");	
		list.id = "failure-listing";		
		for(let k = 0; k<failedTests.length; k++){
			let li = document.createElement("li");			
			let f = failedTests[k];
			li.innerHTML = "<a href = #" + f.id + ">" + f.name + "</a>";
			list.appendChild(li);

			if(addNavig){
				let div = document.getElementById(f.id);
				if(div !== undefined){
					let navig = document.createElement("div");
					navig.style.marginTop = "1em";
					navig.style.fontSize = "14px";
					navig.style.padding = "10 0";
					navig.style.border = "1px solid gray";
					navig.style.borderRight = "none"
					navig.style.borderLeft = "none"
				
					let curr = document.createElement("span");
					curr.textContent = (k+1)+"/"+failedTests.length;
					curr.style.color = "black";
					navig.appendChild(curr);			

					let prev = document.createElement("a");
					prev.textContent = "prev";
					Tester.setNavigButtonStyle(prev);
					if(k > 0)
						prev.href = "#"+failedTests[k-1].id;
					else
						prev.style.backgroundColor = "lightgray";
					navig.appendChild(prev);
					
					let next = document.createElement("a");
					next.textContent = "next";
					Tester.setNavigButtonStyle(next);
					if(k < failedTests.length - 1)
						next.href = "#"+failedTests[k+1].id;
					else
						next.style.backgroundColor = "lightgray";
					navig.appendChild(next);

					let listing = document.createElement("a");
					listing.textContent = "listing";
					Tester.setNavigButtonStyle(listing);
					listing.href = "#"+list.id;
					navig.appendChild(listing);

					div.appendChild(navig);
				}
			}
		}
		document.body.appendChild(list);
		document.location.href = "#"+list.id
	},
	addAspects: function(aspects, testId){
		aspects = this.inSortString(aspects);
		let combo = this.aspComboMap[aspects]
		if(combo === undefined){
			combo = [];
			this.aspComboMap[aspects] = combo;
		}
		combo.push(testId);

		let asparr = this.splitTrim(aspects)
		for(let k = 0; k<asparr.length; k++){
			let asp = asparr[k];
			if(asp == "constructor")
				asp += " "
			let count = this.aspmap[asp] || 0;
			count++;
			this.aspmap[asp] = count;
		}
		return asparr;
	},	
	getAspComboIdList: function(asp, exact){
		asp = this.inSortString(asp);
		let list = [];
		let keys = Object.keys(this.aspComboMap)
		for(let k = 0; k<keys.length; k++){
			let ky = keys[k];
			if(ky.indexOf(asp) >= 0)
				list = list.concat(this.aspComboMap[ky])
		}
		return list;
	},
	splitTrim: function(str){
		return str.split(",").map(function(item){return item.trim()})
	},
	inSortString: function(str){
		return this.splitTrim(str).sort().join(',')
	},
	setNavigButtonStyle: function (button, clr){
		let style = {
			margin: "0 5px",
			textDecoration: "none",
			color: "white",
			backgroundColor: clr || "lightcoral",
			padding: "2px",
			borderRadius: "5px",	
			cursor: "pointer"			,
		};
		let skeys = Object.keys(style);
		for(let k = 0; k<skeys.length; k++)
			button.style[skeys[k]] = style[skeys[k]]
	},
}

Tester.Case = function()
{
	this.exp = "";
	this.gen = [];
	this.name = "";
	this.desc = "";
	this.aspects = "";
	this.id = "test-"+Tester.counter++
}

Tester.Case.prototype.Run = function()
{
	if(typeof this.name != "string")
		throw new Error("Tester.Case name must be of string type only");
	if(typeof this.desc != "string")
		throw new Error("Tester.Case description must be of string type only");
	if(typeof this.aspects != "string")
		throw new Error("Tester.Case aspects must be of string type only");
	if(Array.isArray(this.exp) == false)
		throw new Error("Tester.Case expects an array of strings for expected results");
	if(Array.isArray(this.gen) == false)
		throw new Error("Tester.Case expects an array of strings for generated results");
	if(this.aspects){
		let asparr = Tester.addAspects(this.aspects, this.id)
		this.aspects = asparr.sort().join(", ");
	}
	return this.run();
}

Tester.Case.prototype.AddGenerated = function(gen)
{
	this.gen.push(gen);
}

// out: {boolean, div}
Tester.Case.prototype.run = function()
{
	let div = JEEPTESTUTILS.CreateDiv({add: true});
	div.id = this.id;

	if(this.gen.length == 0 && this.exp.length == 0)
	{
		div.textContent = "The test '" + this.name + "' was empty and therefore PASSED";
		this.gen = [];
		this.exp = [];
		this.name = "";
		return {status: true, div: div};
	}
	
	div.textContent += "Running the test '" + this.name + "'..." + "\n";
	if(this.aspects)
		div.textContent += "Aspects tested: {" + this.aspects + "}\n";
	div.textContent += "Brief info: " + (this.desc ? this.desc : "NA") + "\n";
	
	let pass = true;
	let length = this.exp.length < this.gen.length ? this.exp.length : this.gen.length;
	let partialMatchCount = 0;
	
	for(let k = 0; k<length; k++)
	{
		let b = this.exp[k] == this.gen[k];
		if(b)
			partialMatchCount++;
		else
		{
			if(partialMatchCount > 0)
			{
				div.textContent += "\n(" + partialMatchCount + ") entries matched interim" + "\n";
				partialMatchCount = 0;
			}
			div.textContent += "\n";
			div.textContent += "**  expected : " + this.exp[k] + "\n";
			div.textContent += "**  generated: " + this.gen[k] + "\n";
			div.textContent += "\n";
		}
		pass &= b;
	}
	
	if(partialMatchCount > 0 && partialMatchCount != length)
		div.textContent += "(" + partialMatchCount + ") entries matched interim" + "\n\n";
	
	if(this.exp.length > this.gen.length)
	{
		pass = false;
		div.textContent += "** more expected (" + this.exp.length + ") than generated (" + this.gen.length + ")" + "\n";
		for(let k = length; k<this.exp.length; k++)
			div.textContent += "   " + this.exp[k] + "\n";
	}
	else if(this.exp.length < this.gen.length)
	{
		pass = false;
		div.textContent += "** more generated (" + this.gen.length + ") than expected (" + this.exp.length + ")" + "\n";
		for(let k = length; k<this.gen.length; k++)
			div.textContent += "   " + this.gen[k] + "\n";
	}
	
	if(pass)
	{
		div.textContent += "All entries ("+this.exp.length+") matched" + "\n";
		div.textContent += "PASSED" + "\n";
	}
	else
		div.textContent += "The test '" + this.name + "' FAILED" + "\n";
	
	if(this.aspects)
		div.setAttribute("data-aspects", Tester.inSortString(this.aspects))
	this.gen = [];
	this.exp = [];
	this.name = "";
	return {status: pass, div: div};
}

