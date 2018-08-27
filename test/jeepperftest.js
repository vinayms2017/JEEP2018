function tabluateTestResults(name, test, countArr, desc){
	let columnData = {}
	for(let k = 0; k<countArr.length; k++)
		columnData[countArr[k]] = test(countArr[k])
	let rowLabels = Object.keys(columnData[countArr[0]])
	let rowData = [];
	for(let q = 0; q<rowLabels.length; q++){
		let r = rowLabels[q];
		let rd = [];
		for(let k = 0; k<countArr.length; k++)
			rd.push(columnData[countArr[k]][r].toFixed(3))
		rowData.push(rd)
	}

	let div = JEEPTESTUTILS.CreateDiv({add: true});	
	let table = JEEPTESTUTILS.CreateTable(rowLabels, countArr, rowData, name)
	div.appendChild(table)
	if(desc)
		div.appendChild(document.createTextNode(desc))
	div.style.fontFamily = "initial";
	return div;
}
JEEP.InitFramework();

//--------------------------------------
// test code
//--------------------------------------
let DevEnv = JEEP.CreateEnvironment({client: "jeep-aware", mode: "development-mode"});
let ProdEnv = JEEP.CreateEnvironment({client: "jeep-aware", mode: "production-mode"});

Classes = {
	NonJeep: null,
	JeepDev: null,
	JeepProd: null,
	JeepConstDev: null,
	JeepConstProd: null,
	JeepPrivDev: null,
	JeepPrivProd: null,
}

function generateClasses(){
	Classes.NonJeep = function(){
		this.value = 100;
	}
	Classes.NonJeep.prototype = {
		IncValue: function(){this.value++},
		GetValue: function(){return this.value},
		value: 0,
	}

	let ncdef = {
		CONSTRUCTOR: function(){},
		PUBLIC: {
			IncValue: function(){this.value++},
			GetValue: function(){return this.value},
			value: 0,
		}
	}
	Classes.JeepDev = DevEnv.CreateClassDef("JeepDev", ncdef)
	Classes.JeepProd = ProdEnv.CreateClassDef("JeepProd", ncdef)

	let cdef = {
		CONSTRUCTOR: function(){},
		PUBLIC: {
			IncValue: function(){this.value++},
			GetValue__const: function(){return this.value},
			value: 0,
		}
	}
	Classes.JeepConstDev = DevEnv.CreateClassDef("JeepConstDev", cdef);
	Classes.JeepConstProd = ProdEnv.CreateClassDef("JeepConstProd", cdef);

	let privdef = {
		CONSTRUCTOR: function(){},
		PUBLIC: {
			IncValue: function(){this.value++},
			GetValue: function(){return this.value},
		},
		PRIVATE: {
			value: 0,
		}
	}
	Classes.JeepPrivDev = DevEnv.CreateClassDef("JeepPrivDev", privdef);
	Classes.JeepPrivProd = ProdEnv.CreateClassDef("JeepPrivProd", privdef);

	let privconstdef = {
		CONSTRUCTOR: function(){},
		PUBLIC: {
			IncValue: function(){this.value++},
			GetValue__const: function(){return this.value},
		},
		PRIVATE: {
			value: 0,
		}
	}
	Classes.JeepPrivConstDev = DevEnv.CreateClassDef("JeepPrivDev", privconstdef);
	Classes.JeepPrivConstProd = ProdEnv.CreateClassDef("JeepPrivProd", privconstdef);
}
generateClasses();

PERFTESTS = {
	"record initnew": function(){
		return function (MAX){
			function tester(def){
				let time = 0;
				for(let k = 0; k<MAX; k++){
					if(def){
						let x = performance.now();
						def.InitNew({a: 0, b: 0})
						time += performance.now()-x;
					} else {
						let x = performance.now();
						let a = {a: 0, b: 0}
						time += performance.now()-x;						
					}
				}
				return time;
			}
			let recdef = {a: 0, b: 0}
			let DevRec = DevEnv.CreateRecordDef("rec", recdef)
			let ProdRec = ProdEnv.CreateRecordDef("rec", recdef)
			return {
				"plain object": tester(null),
				"development-mode": tester(DevRec),
				"production-mode": tester(ProdRec)
			}
		}
	},
	"class value read": function(){
		return function (MAX){
			function tester(obj){
				let time = 0;
				let arr = [];
				for(let k = 0; k<MAX; k++){
					let x = performance.now();
					arr.push(obj.GetValue());
					time += performance.now()-x;
				}
				arr = [];
				return time;
			}
			// JeepDev must be fast since it has no access restrictions and constantness, yet it is significantly
			// slow compared to JeepConstDev, for example, which ought to be a lot slow.
			// However.
			// With this dummy test enabled, jeepDev will be faster than when it isn't. WTF. This is obviously related
			// to engine optimization as this can be repeated to all tests below. This is why I think performance
			// tests are stupid and unreliable.
			//tester(Classes.JeepDev.New());// dummy test
			return {
				"Non Jeep": tester(new Classes.NonJeep), 
				"Jeep non constant (dev)": tester(Classes.JeepDev.New()), 
				"Jeep non constant (prod)": tester(Classes.JeepProd.New()), 
				"Jeep constant (dev)": tester(Classes.JeepConstDev.New()), 
				"Jeep constant (prod)": tester(Classes.JeepConstProd.New()), 
				"Jeep private (dev)": tester(Classes.JeepPrivDev.New()),
				"Jeep private (prod)": tester(Classes.JeepPrivProd.New()),
				"Jeep private constant (dev)": tester(Classes.JeepPrivConstDev.New()),
				"Jeep private constant (prod)": tester(Classes.JeepPrivConstProd.New()),
			}
		}
	},

	"class value write": function(){
		return function (MAX){
			function tester(obj){
				let time = 0;
				for(let k = 0; k<MAX; k++){
					let x = performance.now();
					obj.IncValue();
					time += performance.now()-x;
				}
				return time;
			}
			return {
				"Non Jeep": tester(new Classes.NonJeep), 
				"Jeep non constant (dev)": tester(Classes.JeepDev.New()), 
				"Jeep non constant (prod)": tester(Classes.JeepProd.New()), 
				"Jeep constant (dev)": tester(Classes.JeepConstDev.New()), 
				"Jeep constant (prod)": tester(Classes.JeepConstProd.New()), 
				"Jeep private (dev)": tester(Classes.JeepPrivDev.New()),
				"Jeep private (prod)": tester(Classes.JeepPrivProd.New()),
				"Jeep private constant (dev)": tester(Classes.JeepPrivConstDev.New()),
				"Jeep private constant (prod)": tester(Classes.JeepPrivConstProd.New()),
			}
		}
	},
}

keys = Object.keys(PERFTESTS)
for(let k = 0; k<keys.length; k++){
	let test = PERFTESTS[keys[k]]()
	tabluateTestResults(keys[k], test, [1, 10,100,1000,10000])
}
