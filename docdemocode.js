/*
Demonstration code for JEEP.
Written by Vinay.M.S
Usable subject to MIT License
*/

JEEP.InitFramework();
let DemoEnv = JEEP.CreateEnvironment({client: "jeep-aware", mode: "development-mode"});

DemoEnv.CreateField(null, "", {
	rundemo: function(){
		let iter = JEEP.Utils.ObjectIterator.New(DemoCode)
		while(iter.GetNext()){
			let pair = iter.GetCurrPair();
			this.rundemofunc(pair.value, pair.key);
		}
		let p = document.createElement("p");
		p.textContent = "end of demo";
		document.body.appendChild(p)
	},
	rundemofunc__managed: function(f, fname){
		let couter = JEEP.GetObjectDef("DemoPrinter").New();
		let cout = couter.Print.bind(couter);
		JEEP.SetStdErr(cout);
		couter.AddTitle(fname);
		f(cout)
	}
})

DemoEnv.RegisterClassDef("DemoPrinter", {
	CONSTRUCTOR__managed: function(){},
	DESTRUCTOR: function(){
		let div = document.createElement("div");
		div.style.whiteSpace = "pre-wrap";
		div.style.margin = "1em";
		div.style.fontFamily = "courier";
		div.style.fontSize = "16px";
		div.textContent = this.text;
		if(this.title){
			let p = document.createElement("p");
			p.textContent = this.title;
			p.style.fontWeight = "bold";
			div.insertBefore(p, div.firstChild)
		}
		document.body.append(div);
	},
	PUBLIC: {
		Print: function(){
			this.text += Array.prototype.slice.call(arguments,0).join(' ') + "\n";
		},
		AddTitle: function(title){
			this.title = title;
		},
		text: "",
		title: "",
	}
});

let DemoCode = {
	"SetStdErr": function(){		
		let old = JEEP.SetStdErr(function(t){
			let div = document.getElementById("log-div")
			let p = document.createElement("p");
			p.style.color = "red";
			p.textContent = Array.prototype.slice.call(arguments,0).join(' ');
			div.appendChild(p)
		});
		try{JEEP.GetObjectDef("MyObject")}catch(e){}
		JEEP.SetStdErr(old)
	},
	"record": function(cout){
		DemoEnv.RegisterRecordDef("Person", {
			name: "",
			age: 0,
			status: "alive",
		})
		let Citizen = DemoEnv.CreateRecordDef("Citizen", {
			EXTENDS: ["Person"],
			city: ""
		})
		let c = Citizen.InitNew({name: "John Smith", city: "Gotham City", status: "dead", age: 98})
		cout(c.name, c.age, c.status, c.city)
		c = Citizen.InitNew({name: "John Doe", city: "Gotham City", age: 34})
		cout(c.name, c.age, c.status, c.city)
	},
	"record-2d-3d-point": function(cout){
		let pt2d = DemoEnv.CreateRecordDef("2dPoint", {x: 0, y: 0})
		let pt3d = DemoEnv.CreateRecordDef("3dPoint", {
			EXTENDS: [pt2d],
			z: 0,
		})
		let p = pt3d.InitNew({y: -1, z: 10})
		cout("3d point",p.x,p.y,p.z)
	},
	"record-abuse": function(cout){
		let Person = DemoEnv.CreateRecordDef("Person", {
			name: "",
			show: function(){cout("name:", this.name)}
		})
		let p = Person.InitNew({name: "unknown"})
		p.show();
	},
	"struct": function(cout){
		let Vector = DemoEnv.CreateStructDef("Vector", {
		    CONSTRUCTOR: function(rawArr){
		        this.arr = Array.from(rawArr);
		    },
		    arr__private: [],
	        Print: function(){cout(this.$name +": "+ this.arr.join())},
	        Size: function(){return this.arr.length},
	        ApplyOperator: function(op, vec){
	            if(vec && !this.$def.InstanceOf(vec))
	                throw new Error("Vector.ApplyOperator expects a Vector.")
	            vec = vec || this;
	            let res = [];
	            for(let k = 0; k<vec.Size(); k++){
	                switch(op){
	                    case '+': res[k] = vec.arr[k] + this.arr[k]; break;
	                    case '-': res[k] = vec.arr[k] - this.arr[k]; break;
	                    case '*': res[k] = vec.arr[k] * this.arr[k]; break;
	                    case '/': res[k] = vec.arr[k] / this.arr[k]; break;
	                }
	            }
	            return this.$def.New(res);
	        }
		});

		let vec = Vector.New([1,2,3,4,5]);
		let res = vec.ApplyOperator('*', vec.ApplyOperator('*'));
		res.Print();
		try{vec.ApplyOperator("*",10)}catch(e){cout(e.message||e)}
	},
	"struct-initnew": function(cout){
		let Struct = DemoEnv.CreateStructDef("Test", {
			value: 1,
			CONSTRUCTOR: function(){
				if(!this.$initnew)
					this.value = 33;
				cout(this.$name, "value =", this.value)
			}
		});
		Struct.InitNew({value: 10});
		Struct.New();
	},
	"struct-private": function(cout){
		function test(env, retain){
			let Struct = env.CreateStructDef("Test", {
				PMC: retain ? "pmc-memaccess" : "",
				value__private: 1,
				print: function(){cout(this.$name, "value =", this.value)}
			});
			if(env.IsDevMode()) cout("development-mode");
			else cout("production-mode( access check", retain?"retained":"not retained",")")
			try{cout("private value:",Struct.New().value)}catch(e){cout(e)}
		}
		test(JEEP.CreateEnvironment({mode:"development-mode", client: "jeep-aware"}))
		test(JEEP.CreateEnvironment({mode:"production-mode", client: "jeep-aware"}))
		test(JEEP.CreateEnvironment({mode:"production-mode", client: "jeep-aware"}), true)
	},
	"class-access": function(cout){
		let Class = DemoEnv.CreateClassDef("Class", {
			PUBLIC: {
				pubval: 0,
				pubfunc: function(){
					cout("pubval:", this.pubval, "protval:", this.protval, "privval:", this.privval)
				},
			},
			PROTECTED: {
				protval: 100,
			},
			PRIVATE: {
				privval: 200,
			}
		})
		let c = Class.New();
		c.pubfunc();
		try{c.protval=0}catch(e){cout(e)}
		try{c.privval=0}catch(e){cout(e)}
	},
	"class-access-external": function(cout){
		let Class = DemoEnv.CreateClassDef("Class", {
			PUBLIC: {
				pubval: 0,
				callback: function(f){f(this)},
				callbackExt: function(v, f){this.ExternalCall(f, this, v)}
			},
			PROTECTED: {
				protval: 100,
			},
			PRIVATE: {
				privval: 200,
			}
		})
		let c = Class.New();
		c.callback(function(inst){
			cout( "protval:", inst.protval, "privval:", inst.privval)
		});
		try{
		c.callbackExt(100, function(inst, val){
			inst.protval = val
		});}catch(e){cout(e)}
	},
	"class-getter-setter": function(cout){
		let Class = DemoEnv.CreateClassDef("Class", {
			PUBLIC: {
				count: function(){this.counter+=this.step}
			},
			PRIVATE: {
				counter__get: 0,
				step__get_set: 1,
			},
		})
		let c = Class.New();
		c.count();
		cout("c.counter", c.getCounter())
		c.setStep(2);
		c.count();
		cout("c.counter", c.getCounter())
	},
	"class-constant-variable": function(cout){
		let Class = DemoEnv.CreateClassDef("Class", {
		PUBLIC: { 
				value__const: 10,
				obj__const: {val: 0},
				changeValue: function(x){this.value = x},
				changeObj: function(x){this.obj.val = x},
				callback: function(f){f(this)},
				print: function(){cout("value:", this.value, "obj.val", this.obj.val)}
			}
		})
		let c = Class.New();
		try{c.value=22}catch(e){cout(e)}
		try{c.obj.val=22}catch(e){cout(e)}
		c.print();
		try{c.changeValue(33)}catch(e){cout(e)}
		try{c.changeObj(33)}catch(e){cout(e)}
		c.print();
		c.callback(function(inst){
			try{inst.changeValue(999)}catch(e){cout(e)}
			try{inst.changeObj(999)}catch(e){cout(e)}
		})
		c.print();
	},
	"class-constant-function": function(cout){
		let Class = DemoEnv.CreateClassDef("Class", {
			PUBLIC: { 
				value: 10,
				change__const: function(x){this.value = x},
				callback__const: function(f){f(this)},
				print: function(){cout("value:", this.value)}
			}
		})
		let c = Class.New();
		try{c.change(33)}catch(e){cout(e)}
		try{c.callback(function(inst){inst.change(44)})}catch(e){cout(e)}
		try{c.callback(function(inst){inst.value=55})}catch(e){cout(e)}
		c.print();
	},
	"class-function-argnum": function(cout){
		let Class = DemoEnv.CreateClassDef("Class", {
			PUBLIC: { 
				value: 0,
				work__argnum: function(x, y){cout("working with",x,y)},
				workx__argnumvar: function(x, y){cout("working with",x,y,arguments[2])},
			}
		})
		let c = Class.New();
		c.work(1,2);
		c.workx(1,2,3)
		try{c.work(33)}catch(e){cout(e)}
		try{c.work(33, 100, 200)}catch(e){cout(e)}
		try{c.workx(33)}catch(e){cout(e)}
	},
	"class-function-argconst": function(cout){
		let Class = DemoEnv.CreateClassDef("Class", {
			PUBLIC: { 
				value: 0,
				work__argconst: function(x, obj){x = 0; obj.val = x},
			}
		})
		let c = Class.New();
		try{c.work(33, {val: 100})}catch(e){cout(e)}
	},
	"class-function-argtype": function(cout){
		let Class = DemoEnv.CreateClassDef("Class", {
			PUBLIC: { 
				value: 0,
				work__argtype: function(val__number){
					return function(val){
						cout("given value:",val)
					}
				}
			}
		})
		let c = Class.New();
		c.work(10)
		try{c.work({val: 100})}catch(e){cout(e)}
	},
	"class-function-argtype-bad syntax": function(cout){
		try{DemoEnv.CreateClassDef("Class", {
			PUBLIC: { 
				value: 0,
				work__argtype: function(val__number){
					return function(value){
						cout("given value:",val)
					}
				},
				work2__argtype: function(a,b){
					return function(a,b){}
				},
				work3__argtype: function(a__number){
				}
			}
		})}catch(e){cout(e)}
	},
	"class-function-argtype-any": function(cout){
		let Class = DemoEnv.CreateClassDef("Class", {
			PUBLIC: { 
				value: 0,
				work__argtype: function(val__number, x){
					return function(val, x){
						cout("given value:",val, "x:",x)
					}
				}
			}
		})
		let c = Class.New();
		c.work(10,100);
		c.work(10, "ten")
	},
	"class-function-argtype-udt": function(cout){
		DemoEnv.RegisterClassDef("MyClass", {
			PUBLIC: { 
				value: 0,
				work__argtype: function(val__number, rec__DataRecord, cl__MyClass){
					return function(val, rec, cl){
						cout("given value:",val, "rec.value:",rec.value, "c.value:",c.value)
					}
				}
			}
		})
		DemoEnv.RegisterRecordDef("DataRecord", {value: 100})
		let MyClass = JEEP.GetObjectDef("MyClass")
		let c = MyClass.New();
		let DR = JEEP.GetObjectDef("DataRecord")
		c.work(10, DR.New(), c);
		try{c.work(10, "ten", 10)}catch(e){cout(e)}
	},
	"class-function-argtype-udt-unregistered": function(cout){
		let Class = DemoEnv.CreateClassDef("MyClass", {
			PUBLIC: { 
				value: 0,
				work__argtype: function(val__number, rec__FileRecord){
					return function(val, rec){
					}
				}
			}
		})
		let c = Class.New();
		try{c.work(10, "ten")}catch(e){cout(e)}
	},
	"class-new-initnew-copyctor": function(cout){
		let Class = DemoEnv.CreateClassDef("Class", {
			CONSTRUCTOR: function(x){
				if(this.$initnew)
					cout("InitNew mechanism invoked")
				else{
					cout("constructing...")
					this.value = x;
				}
			},
			PUBLIC: {
				value: 0,
				print: function(){cout("value:", this.value)}
			}
		})
		let c = Class.New({value: 100})
		c.print();
		c.value = 200;
		Class.New(c).print();
		Class.New(300).print();
	},
	"class-construction-failure": function(cout){
		let Class = DemoEnv.CreateClassDef("Class", {
			CONSTRUCTOR: function(x){
				if(x < 0) return "negative value is invalid";
				this.value = x;
			},
			PUBLIC: {
				value: 0,
				print: function(){cout("value:", this.value)},
			}
		})
		try{Class.New(-10).print();}catch(e){cout(e)}
		Class.New(10).print();
	},
	"class-managed": function(cout){
		DemoEnv.RegisterClassDef("Logger", {
			CONSTRUCTOR__managed: function(){},
			DESTRUCTOR: function(){this.Commit()},
			PUBLIC: {
				Append: function(a){ this.logs.push(a)},
				Commit: function(){
					cout("Logging the following", this.logs.length,"entries")
					for(let k = 0; k<this.logs.length; k++)
						cout((k+1),this.logs[k])
				}
			},
			PRIVATE: {
				logs: []
			}
		})

		let Class = DemoEnv.CreateClassDef("Class", {
			PUBLIC: {
				value: 0,
				work__managed: function(){		
					let logger = JEEP.GetObjectDef("Logger").New()
		            logger.Append("first")
		            logger.Append("second")
		            logger.Append("third")
		            throw new Error("simulated exception")
				}
			}
		})
		try{Class.New().work()}catch(e){cout(e)}
		cout("other code")
	},
	"class-weak-robustness": function(cout){
		let Class = DemoEnv.CreateClassDef("Class", {
			PUBLIC:{
				value: 0,
				info__const: {value: 0},
				printValue__const: function(){
					this.value = 100;
					cout("value:", this.value)
				},
				print: function(){
					this.info.value = 100;
					this.show();
				},
				show: function(){ cout("info.value:", this.info.value)}
			}
		})
		try{Class.New().printValue()}catch(e){cout(e)}
		try{Class.New().print()}catch(e){cout(e)}
	},
	"class-single-inheritance": function(cout){
		let Base = DemoEnv.CreateClassDef("Base", {
			CONSTRUCTOR: function(v){
				cout(this.$name,"base constructing...")
				this.value = v;
			},
			PUBLIC: {
				print: function(){
					cout("base value:", this.value)
				}
			},
			PROTECTED:{
				value: 0,
			},
			PRIVATE: {
				privvar: 0
			}
		})
		let Derived = DemoEnv.CreateClassDef("Derived", {
			EXTENDS: [Base],
			CONSTRUCTOR: function(v){
				cout(this.$name,"derived constructing...")
				this.value = v;
			},
			PUBLIC: {
				show: function(){
					cout("derived value:", this.value)
					try{cout("value:", this.privvar)}catch(e){cout(e)}
				}
			}
		})
		let d = Derived.New(100);
		d.print();
		d.show();
	},
	"class-single-inheritance-virtual": function(cout){
		let Base = DemoEnv.CreateClassDef("Base", {
			PUBLIC: {
				value: 0,
				run: function(){
					this.print();
					this.work();
				}
			},
			PROTECTED:{
				print__virtual: function(){cout("base print")}
			},
			PRIVATE: {
				work__virtual: function(){cout("base work")}
			}
		})
		let Derived = DemoEnv.CreateClassDef("Derived", {
			EXTENDS: [Base],
			PROTECTED:{
				print__virtual: function(){
					cout("derived print")
					this.$base.Base.print();
				}
			},
			PRIVATE: {
				work__virtual: function(){cout("derived work")}
			}
		})
		let d = Derived.New();
		d.run();
	},
	"class-single-inheritance-abstract": function(cout){
		let Base = DemoEnv.CreateClassDef("Base", {
			PUBLIC: {
				value: 0,
				run: function(){
					this.print();
					this.work();
				}
			},
			PROTECTED:{
				print__abstract: function(){}
			},
			PRIVATE: {
				work__abstract: function(){}
			}
		})
		let Derived = DemoEnv.CreateClassDef("Derived", {
			EXTENDS: [Base],
			PROTECTED:{
				print__virtual: function(){cout("derived print")}
			},
			PRIVATE: {
				work__virtual: function(){cout("derived work")}
			}
		})
		try{Base.New()}catch(e){cout(e)}
		Derived.New().run();
	},
	"class-single-inheritance-failed-instantiation": function(cout){
		let TopBase = DemoEnv.CreateClassDef("TopBase", {
			CONSTRUCTOR__managed: function(v){
				cout("topbase constructing...")
			},
			DESTRUCTOR: function(v){
				cout("topbase destructing...")
			},
			PUBLIC: {
				value: 0,
				print: function(){},
			},
		})
		let MidBase = DemoEnv.CreateClassDef("MidBase", {
			EXTENDS: [TopBase],
			CONSTRUCTOR__managed: function(v){
				cout("midbase constructing...")
			},
			DESTRUCTOR: function(v){
				cout("midbase destructing...")
			},
		})
		let LowBase = DemoEnv.CreateClassDef("LowBase", {
			EXTENDS: [MidBase],
			CONSTRUCTOR__managed: function(v){
				return  "invalid initial value given"
			},
			DESTRUCTOR: function(v){
				cout("lowbase destructing...")
			},
		})
		let Derived = DemoEnv.CreateClassDef("Derived", {
			EXTENDS: [LowBase],
			CONSTRUCTOR__managed: function(v){
				cout("derived constructing...")
			},
			DESTRUCTOR: function(v){
				cout("derived destructing...")
			},
		})
		try{Derived.New()}catch(e){cout(e)}
	},
	"class-disabled-polymorphism": function(cout){
		let TopBase = DemoEnv.CreateClassDef("TopBase", {
			CONSTRUCTOR__managed: function(v){
				cout("TopBase constructing...")
				this.tbprint();
			},
			DESTRUCTOR: function(v){
				cout("TopBase destructing...")
				this.tbprint();
			},
			PUBLIC: {
				value: 0,
				tbprint__virtual: function(){cout("TopBase printing...")},
			},
		})
		let MidBase = DemoEnv.CreateClassDef("MidBase", {
			EXTENDS: [TopBase],
			CONSTRUCTOR__managed: function(v){
				cout("MidBase constructing...")
				this.mbprint();
			},
			DESTRUCTOR: function(v){
				cout("MidBase destructing...")
				this.mbprint();
			},
			PUBLIC: {
				tbprint__virtual: function(){cout("MidBase printing...")},
				mbprint__virtual: function(){cout("MidBase printing...")},
			},
		})
		let Derived = DemoEnv.CreateClassDef("Derived", {
			EXTENDS: [MidBase],
			CONSTRUCTOR__managed: function(v){
				cout("Derived constructing...")
				this.print();
			},
			DESTRUCTOR: function(v){
				cout("Derived destructing...")
				this.print();
			},
			PUBLIC: {
				print__virtual: function(){cout("Derived printing...")},
				tbprint__virtual: function(){cout("Derived printing...")},
				mbprint__virtual: function(){cout("Derived printing...")},
			},
		})
		let Class = DemoEnv.CreateClassDef("Class", {
			PUBLIC: {
				v: 0,
				test__managed: function(){
					cout("<TopBase instantiated>")
					TopBase.New();
					cout("<MidBase instantiated>")
					MidBase.New();
					cout("<Derived instantiated>")
					Derived.New()
				}
			}
		})
		Class.New().test();
	},
	"class-disabled-polymorphism-trap": function(cout){
		let Env = JEEP.CreateEnvironment({mode: "development-mode", client: "jeep-aware", flags: "trap-disabled-virtual-call"})
		let Base = Env.CreateClassDef("Base", {
			CONSTRUCTOR__managed: function(v){
				cout("base constructing...")
				this.print();
			},
			DESTRUCTOR: function(v){
				cout("base destructing...")
				this.print();
			},
			PUBLIC: {
				value: 0,
				print__virtual: function(){cout("base printing...")},
			},
		})
		let Derived = Env.CreateClassDef("Derived", {
			EXTENDS: [Base],
			CONSTRUCTOR__managed: function(v){
				cout("derived constructing...")
			},
			DESTRUCTOR: function(v){
				cout("derived destructing...")
			},
			PUBLIC: {
				print__virtual: function(){cout("derived printing...")},
			},
		})
		let Class = Env.CreateClassDef("Class", {
			PUBLIC: {
				v: 0,
				test__managed: function(){
					Derived.New().print();
				}
			}
		})
		try{Class.New().test()}catch(e){cout(e)}
		cout("other code")
	},
	"class-disabled-polymorphism-trap-reason": function(cout){
		let Class = DemoEnv.CreateClassDef("Class", {
			CONSTRUCTOR: function(callback){
				callback(this)
			},
			PUBLIC: {
				v: 0,
				print__virtual: function(){
					cout("printing...")
				}
			}
		})
		Class.New(function(inst){
			inst.print()
		})
	},
	"class-static": function(cout){
		let Class = DemoEnv.CreateClassDef("Class", {
			CONSTRUCTOR: function(n){this.name = n},
			PUBLIC: {
				name: "",
				printPrivStat: function(){
					this.$static.printPrivStat(this.name)
				},
				changePrivStat: function(x){this.$static.privvalue = x},
			},
			STATIC: {
				pubvalue: 10,		
				privvalue__private: 30,	
				printPrivStat: function(name){
					cout(name+".privvalue:", this.privvalue)					
				},
			}
		})
		let c1 = Class.New("first");
		c1.printPrivStat();
		c1.changePrivStat(1023);
		c1.printPrivStat();
		let c2 = Class.New("second")
		c2.printPrivStat();
		try{cout("Class.STATIC.pubvalue:",Class.STATIC.pubvalue)}catch(e){cout(e)}
		try{cout("Class.STATIC.privvalue:",Class.STATIC.privvalue)}catch(e){cout(e)}
	},
	"class-static-inheritance": function(cout){
		let Class = DemoEnv.CreateClassDef("Class", {
			CONSTRUCTOR: function(n){this.name = n},
			PUBLIC: {
				name: "",
				printPrivStat: function(){
					cout(this.name+".privvalue:", this.$static.privvalue)
				},
				changePrivStat: function(x){this.$static.privvalue = x},
			},
			STATIC: {
				pubvalue: 10,		
				privvalue__private: 30,	
			}
		})
		let Derived = DemoEnv.CreateClassDef("Derived", {
			EXTENDS: [Class],
			PUBLIC: {
				work: function(){
					cout(this.name+".privvalue:", this.$static.privvalue)
					cout(this.name+".Class.pubvalue:", this.$static.$base.Class.pubvalue)
					try{this.$static.$base.Class.privvalue = 0;}catch(e){cout(e)}
				}
			},
			STATIC: {
				privvalue__private: -1
			}
		})
		let c1 = Class.New("firstbase");
		c1.changePrivStat(1023);
		let d = Derived.New("derived");
		d.printPrivStat();
		d.work();
		try{Derived.STATIC.privvalue = 0;}catch(e){cout(e)}
	},
	"class-multiple-inheritance": function(cout){
		let TopBase = DemoEnv.CreateClassDef("TopBase", {
			CONSTRUCTOR__managed: function(){
				cout("TopBase constructing...")
			},
			DESTRUCTOR: function(){
				cout("TopBase destructing...")
			},
			PUBLIC: {v: 0, f: function(){}}
		})
		let MidBaseA = DemoEnv.CreateClassDef("MidBaseA", {
			EXTENDS: [TopBase],
			CONSTRUCTOR__managed: function(){
				cout("MidBaseA constructing...")
			},
			DESTRUCTOR: function(){
				cout("MidBaseA destructing...")
			},
		})
		let MidBaseB = DemoEnv.CreateClassDef("MidBaseB", {
			EXTENDS: [TopBase],
			CONSTRUCTOR__managed: function(){
				cout("MidBaseB constructing...")
			},
			DESTRUCTOR: function(){
				cout("MidBaseB destructing...")
			},
		})
		let BaseX = DemoEnv.CreateClassDef("BaseX", {
			CONSTRUCTOR__managed: function(){
				cout("BaseX constructing...")
			},
			DESTRUCTOR: function(){
				cout("BaseX destructing...")
			},
			PUBLIC: {vv: 0, ff: function(){}}
		})
		let Derived = DemoEnv.CreateClassDef("Derived", {
			EXTENDS: [MidBaseA, MidBaseB, BaseX],
			CONSTRUCTOR__managed: function(){
				cout("Derived constructing...")
			},
			DESTRUCTOR: function(){
				cout("Derived destructing...")
			},
		})
		DemoEnv.CreateClassDef("Class", {
			PUBLIC: {
				v: 0,
				test__managed: function(){
					Derived.New();
				}
			}
		}).New().test();
	},
	"class-multiple-inheritance-reinforcing-abstraction": function(cout){
		let TopBase = DemoEnv.CreateClassDef("TopBase", {
			PUBLIC: {
				v: 0, 
				work__virtual: function(){}
			}
		})
		let MidBaseA = DemoEnv.CreateClassDef("MidBaseA", {
			EXTENDS: [TopBase],
			PUBLIC: {
				work__virtual: function(){}
			}
		})
		let MidBaseB = DemoEnv.CreateClassDef("MidBaseB", {
			EXTENDS: [TopBase],
			PUBLIC: {
				work__abstract: function(){}
			}
		})
		let Derived = DemoEnv.CreateClassDef("Derived", {
			EXTENDS: [MidBaseA, MidBaseB],
		})
		try{Derived.New()}catch(e){cout(e)}
	},
	"wrapper-class": function(cout){
		let BaseX = DemoEnv.CreateClassDef("BaseX", {
			PUBLIC: {
				callPrint: function(){this.print()},
			},
			PROTECTED: {
				print: function(){cout("BaseX.value:", this.value)}				
			},
			PRIVATE: {
				value: 1,
			},
		})
		DemoEnv.RegisterClassDef("BaseY", {
			PUBLIC: {
				value: 2,
				print: function(){cout("BaseY.value:", this.value)}
			}
		})
		let WrBaseY = DemoEnv.CreateClassWrapper("BaseY", {
			Functions: {
				"print": "show"
			},
			Variables: {
				"value": "number"
			}
		})
		let Derived = DemoEnv.CreateClassDef("Derived", {
			EXTENDS: [BaseX, WrBaseY],
			PUBLIC: {
				test: function(){
					this.print();
					this.callPrint();
					this.show();
					cout("derived number", this.number);
					try{this.value}catch(e){cout(e)}
				}
			}
		})
		let d = Derived.New();
		d.test();
		d.callPrint();
		try{d.value}catch(e){cout(e)}
	},
	"wrapper-class-virtual": function(cout){
		let BaseX = DemoEnv.CreateClassDef("BaseX", {
			PUBLIC: {
				callPrint: function(){this.print()},
			},
			PROTECTED: {
				print__virtual: function(){cout("BaseX.value:", this.value)},		
				value: 1,
			},
		})
		DemoEnv.RegisterClassDef("BaseXX", {
			EXTENDS: [BaseX],
			PUBLIC: {
				print__virtual: function(){cout("BaseXX.value:", this.value)}
			}
		})
		let WrBaseXX = DemoEnv.CreateClassWrapper("BaseXX", {
			Functions: {
				"print": "show"
			},
		})
		let BaseY = DemoEnv.CreateClassDef("BaseY", {
			PUBLIC: {
				count: 2,
				print: function(){cout("BaseY.value:", this.count)}
			}
		})
		let Derived = DemoEnv.CreateClassDef("Derived", {
			EXTENDS: [BaseY, WrBaseXX],
			PUBLIC: {
				test: function(){
					this.print();
					this.callPrint();
					this.show();
				}
			}
		})
		Derived.New().test();
	},
	"class-mermaid": function(cout){
		DemoEnv.RegisterClassDef("Animal", {
			CONSTRUCTOR: function(n){
				this.name = n;
			},
			PUBLIC: {
				liveOneMoment: function(){
					this.breathe();
					this.move();
				}
			},
			PROTECTED: {
				breathe__abstract: function(){},
				move__abstract: function(){},
			},
			PRIVATE: {
				name__get: "",
			}
		})
		DemoEnv.RegisterClassDef("Fish", {
			EXTENDS: ["Animal"],
			PROTECTED: {
				breathe__virtual: function(){cout(this.$name, this.getName(),"breathing through gills")},
				move__virtual: function(){cout(this.$name, this.getName(),"moving using tail fins")},
			}
		})
		let Human = DemoEnv.CreateClassDef("Human", {
			EXTENDS: ["Animal"],
			PROTECTED: {
				breathe__virtual: function(){cout(this.$name, this.getName(),"breathing through nose")},
				move__virtual: function(){cout(this.$name, this.getName(),"moving by walking")},
			}
		})
		DemoEnv.RegisterClassDef("Mermaid", {
			EXTENDS: ["Fish", Human],
			PROTECTED: {
				breathe__virtual: function(){this.$base.Human.breathe()},
				move__virtual: function(){this.$base.Fish.move()},
			}
		})
		let Mermaid = JEEP.GetObjectDef("Mermaid");
		let m = Mermaid.New("Mermy");
		m.liveOneMoment();
	},
	"field": function(cout){
		let obj = {};
		DemoEnv.CreateField(obj, "Field", {
			square: function(x){return x*x},
			print: function(m,x){cout(m,x)}
		})
		let n = obj.square(10)
		obj.print("square of 10:", n)
	},
	"field-hack-struct": function(cout){
		let obj = {value: 100};
		DemoEnv.CreateField(obj, "Field", {
			print: function(){cout("value:", this.value)}
		})
		obj.print();
	},
	"group": function(cout){
		DemoEnv.RegisterGroup("Maths", {
			CONSTRUCTOR: function(accuracy){
				cout("initializing settings...")
				this.accuracy = accuracy;
			},
			PUBLIC: {
				calculate: function(x){
					this.docalc(x);
				}
			},
			PRIVATE: {
				accuracy: 0.001,
				docalc: function(x){cout("calculating", x, "with accuracy",this.accuracy,"...")}
			}
		})
		let M = JEEP.GetObjectDef("Maths")
		M.Init(0.01);
		M.Init(0.003);
		M.calculate("log(10)")
		try{M.docalc("log(10)")}catch(e){cout(e)}
	},
	"typedef": function(cout){
		DemoEnv.RegisterRecordDef("Record", {name: "unknown"})
		JEEP.Typedef("MyRecord", "Record");
		let Record = JEEP.GetObjectDef("MyRecord");
		let r = Record.New();
		cout("r.name:",r.name)
	},
	"namespace": function(cout){
		DemoEnv.RegisterStructDef("MyStruct", {
			value: 0,
			print: function(){cout(this.$name,this.value)}
		})
		let NS = DemoEnv.CreateNamespace();
		NS.RegisterStructDef("MyStruct", {
			value: 1,
			print: function(){cout(this.$name,this.value)}
		})
		JEEP.GetObjectDef("MyStruct").New().print();
		NS.GetObjectDef("MyStruct").New().print();
	},
	"namespace-typedef": function(cout){
		DemoEnv.RegisterStructDef("NotMyStruct", {
			value: 0,
			print: function(){cout(this.$name,this.value)}
		})
		let NS = DemoEnv.CreateNamespace();
		NS.RegisterStructDef("MyStruct", {
			value: 1,
			print: function(){cout(this.$name,this.value)}
		})
		JEEP.GetObjectDef("NotMyStruct").New().print();
		let NSStruct = NS.GetObjectDef("MyStruct");
		NSStruct.New().print();
		JEEP.Typedef("StructT", NSStruct.$name)
		let ST = JEEP.GetObjectDef("StructT");
		let st = ST.New();
		st.print();
		cout("Implementation name of",st.$name,":",ST.$name)
	},
 	"namespace-typedef-argtype-udt": function(cout){
		let MyClass = DemoEnv.CreateClassDef("MyClass", {
			PUBLIC: { 
				value: 0,
				work__argtype: function(val__number, rec__MyDataRecord){
					return function(val, rec){
						cout("given value:",val, "rec.value:",rec.value)
					}
				}
			}
		})
		let NS = DemoEnv.CreateNamespace();
		NS.RegisterStructDef("DataRecord", {
			value: 1,
			print: function(){cout(this.$name,this.value)}
		})
		JEEP.Typedef("MyDataRecord", NS.GetObjectDef("DataRecord").$name)

		let c = MyClass.New();
		let DR = NS.GetObjectDef("DataRecord")
		c.work(10, DR.New());
	},
   "namespace-partition": function(cout){
		let ns = DemoEnv.CreateNamespace();
		ns.Partition("first, second, third");
		cout("Main namespace parts:", Object.keys(ns.$).join(','))

		let second = ns.$.second;
		second.Partition("top, bottom")
		second.$.top.Partition("x,y,z")
		cout("Sub namespace parts:", Object.keys(ns.$.second.$).join(','))
		let flat = ns.Flatten();
		cout("Flattened namespace parts:",Object.keys(flat).join(','))

		cout("Main namespace parts:", Object.keys(ns.$).join(','))
	},
	"library": function(cout){
		JEEP.RegisterLibrary("MyLibrary", function(x){
			cout("initializing", this.$name, "with", x)
			this.namespace.RegisterRecordDef("Rec", {value: x*100})
		});
		let Lib = DemoEnv.GetLibrary("MyLibrary", 3);
		Lib = DemoEnv.GetLibrary("MyLibrary", 12);
		let r = Lib.GetObjectDef("Rec").New();
		cout("record.value", r.value);
	},
	"library-builder-small": function(cout){
		JEEP.RegisterLibrary("MySmallLib", function(x){			
			cout("initializing", this.$name, "with", x)	
			this.Build({
				"": {builder: "sbbldr", args: x+3},
				"sublib": {builder: "sbbldr", args: x+5},
			})
		})

		JEEP.RegisterLibraryBuilder("sbbldr", "MySmallLib", function(x){
			cout("initializing", this.$name, "with", x)
			this.namespace.RegisterRecordDef("Rec", {value: x*100})
		})

		let Lib = DemoEnv.GetLibrary("MySmallLib", 3);
		let r = Lib.GetObjectDef("Rec").New();
		cout("record.value", r.value);
		r = Lib.$.sublib.GetObjectDef("Rec").New();
		cout("record.value", r.value);
	},
	"library-builder-large": function(cout){
		JEEP.RegisterLibrary("Lib", function(options){				
			cout("initializing",this.$name,"...")
			this.Build({
				"graphics": {builder: "grBuilder", args: options},
				"network": {builder: "nwBuilder"}
			})
		})

		// in real applicaiton, these would be in separate files

		JEEP.RegisterLibraryBuilder("nwBuilder", "Lib", function(){
			this.namespace.RegisterRecordDef("Socket", {protocol: "tcp/ip"})
		})
		JEEP.RegisterLibraryBuilder("grBuilder", "Lib", function (options){
			let builderInfo = {};
			if(options.gr2d)
				builderInfo["gr2d"] = {builder: "gr2dBuilder"}
			if(options.gr3d)
				builderInfo["gr3d"] = {builder: "gr3dBuilder", args: options}
			this.Build(builderInfo);
		})
		JEEP.RegisterLibraryBuilder("gr2dBuilder", "Lib", function (options){
			this.namespace.RegisterRecordDef("Point", {x: 0, y: 0})
		})
		JEEP.RegisterLibraryBuilder("gr3dBuilder", "Lib", function (options){
			let ns = this.BuildPrivate({
				"native": {builder: "native3dLib"},
				"vendor": {builder: "vendor3dLib"}
			});
			this.namespace.RegisterRecordDef("Point", {x: 0, y: 0, z: 0})
			this.namespace.RegisterField("CoolFeatures", {
				DoCF: function(point){
					execFeature("DoCF", point)
				},
				DoAnotherCF: function(point){
					execFeature("DoAnotherCF", point)
				},
			})
			function getFeature(lib, field, func){
				if(!ns.$[lib].ObjectDefExists(field))
					return null;
				let fieldObj = ns.$[lib].GetObjectDef(field)
				return fieldObj[func];
			}
			function execFeature(feature, args){			
				let func = getFeature("native", "CoolFeatures", feature)
				if(!func)
					func = getFeature("vendor", "CoolFeatures", feature)
				if(!func)
					throw "CoolFeatures."+feature+" not available."
				return func.apply(null, [args]);
			}
		})
		JEEP.RegisterLibraryBuilder("native3dLib", "Lib", function(){
			this.namespace.RegisterRecordDef("Point", {x: 0, y: 0, z: 0})
		})
		JEEP.RegisterLibraryBuilder("vendor3dLib", "Lib", function (){
			this.namespace.RegisterRecordDef("Point", {x: 0, y: 0, z: 0})
			this.namespace.RegisterField("CoolFeatures", {
				DoCF: function(point){
					cout("DOING VEDNOR GRAPHICS FEATURE at", point.x, point.y, point.z)
				},
			})
		})

		let Lib = DemoEnv.GetLibrary("Lib", {gr3d: true});
		Lib = Lib.Flatten();
		let socket = Lib.network.GetObjectDef("Socket");
		let s = socket.New();
		cout("socket created for: ",s.protocol);

		let CF = Lib.graphics.$.gr3d.GetObjectDef("CoolFeatures")// also available as Lib.gr3d, as below
		let pt3d = Lib.gr3d.GetObjectDef("Point");
		let pt = pt3d.InitNew({x: 10, y: 10});
		try{CF.DoCF(pt)}catch(e){cout(e)}
		try{CF.DoAnotherCF(pt)}catch(e){cout(e)}
	},
	"utils-copyprops": function(cout){
		let dest = {};

		// test normal property
		JEEP.Utils.CopyProps({a: 1, b: 2, c: 3}, dest)
		let keys = Object.keys(dest)
		for(let k = 0; k<keys.length; k++)
			cout(keys[k], dest[keys[k]])

		// test normal property selected names
		dest = {};
		JEEP.Utils.CopyProps({a: 1, b: 2, c: 3}, dest, ["a","b"])
		keys = Object.keys(dest)
		for(let k = 0; k<keys.length; k++)
			cout(keys[k], dest[keys[k]])

		// test defined property
		dest = {};
		let src = {a: 1, b: 2}
		Object.defineProperty(src, "a", {
			get: function(){return -1}
		})
		JEEP.Utils.CopyProps(src, dest);
		keys = Object.keys(dest)
		for(let k = 0; k<keys.length; k++)
			cout(keys[k], dest[keys[k]])
	},
	"utils-splittrim": function(cout){
		let text = " first, second,  third  ";
		let st = JEEP.Utils.SplitTrim(text, ',')
		// cout with concat to avoid spurious spaces
		cout("input: \"" + text + "\"")
		cout("output: \""+st.join() +"\"");
	},
	"utils-makeflags": function(cout){
		let flags = JEEP.Utils.MakeFlags("test", "first, second, third")
		let keys = Object.keys(flags)
		for(let k = 0; k<keys.length; k++)
			cout(keys[k], flags[keys[k]])
		let env = JEEP.CreateEnvironment({mode: "development-mode", client: "jeep-aware"});
		let fnames = "";
		for(let k = 0; k<33; k++)
			fnames += "f"+k+","
		try{JEEP.Utils.MakeFlags("Test", fnames, env)}catch(e){cout(e)}
		try{JEEP.Utils.MakeFlags("Test", "f,g,f,g,f", env)}catch(e){cout(e)}
	},
	"utils-recursiveflag": function(cout){
		let rf = JEEP.Utils.RecursiveFlag.New();
		cout("flag is", rf.isSet()?"set":"not set")
		rf.add();
		cout("flag is", rf.isSet()?"set":"not set")
		rf.remove();
		cout("flag is", rf.isSet()?"set":"not set")
		for(let k = 0; k<10; k++)
			rf.remove();
		rf.add();
		cout("flag is", rf.isSet()?"set":"not set")
	},
	"utils-objectiterator": function(cout){
		// empty object
		let iter = JEEP.Utils.ObjectIterator.New({})
		cout("total properties in empty object:", iter.Total())

		// valid object
		iter.Reset(JEEP.Utils.MakeFlags("","a,b,c,d,e"))
		cout("total flags:", iter.Total())
		while(iter.GetNext()){
			let pair = iter.GetCurrPair();
			cout(pair.key,pair.value)
		}

		// direct access after reset
		iter.Reset({a: 0, b: 1})
		cout("direct access",iter.GetCurrKey(), iter.GetCurrValue())

		// undefined object
		iter.Reset();
		cout("total properties in undefined:", iter.Total())
		cout("key:", iter.GetCurrKey()||"undefined", "value:",iter.GetCurrValue()||"undefined")
		while(iter.GetNext()){
			let pair = iter.GetCurrPair();
			cout("pair",pair.key,pair.value)
		}

		// non object
		iter.Reset(100);
		cout("total properties in integer:", iter.Total())
		cout("key:", iter.GetCurrKey()||"undefined", "value:",iter.GetCurrValue()||"undefined")
		while(iter.GetNext()){
			let pair = iter.GetCurrPair();
			cout("pair",pair.key,pair.value)
		}
	},
	"utils-flagprocessor": function(cout){
		let fp = JEEP.Utils.FlagProcessor.New({
			first: 1,
			second: 2,
			third: 4
		})
		let res = fp.Process({flags: "first, second"})
		cout("flag value:",res.flags)

		res = fp.Process({flags: "first, second, fifth, sixth", markError: true})
		cout("invalid flags:",res.errors.join(','))

		res = fp.Process({flags: "first, second", singleOnly: true})
		cout("result object:",res==null?"null":"not null")

		res = fp.Process({flags: "fifth, sixth", markError: true, singleOnly: true})
		cout("invalid flags:",res.errors.join(','))

		res = fp.Process({flags: "first, second, fifth, sixth", markError: true, singleOnly: true})
		cout("result object:",res==null?"null":"not null")
	},
	"utils-messageformatter": function(cout){
		let MF = JEEP.Utils.MessageFormatter.New({
		    "-test": "Testing $dollar$ -count-.",
		   "greetings": "Hello. My name is $last-name$, $first-name$ $last-name$.",
		    "dollar": "$ means dollar",
		});

		let m = MF.Get("test", {
		    count: "1,2,3",
		})
		cout(m);

		m = MF.Get("greetings", {
		    "first-name": "Olya",
		    "last-name": "Povlatsky"
		})
		cout(m);
		    
		m = MF.Get("dollar", {
		    how: "good",
		    what: "World",
		})
		cout(m);			    
	},
}

rundemo();
