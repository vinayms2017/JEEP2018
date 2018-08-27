/*
Test cases for JEEP.
Written by Vinay.M.S

The testing mechanism is simple - set some expected results, run the tests which generate 
results, and then compare both.

JEEP has five core objects - record, structure, class, field, group - and two associate 
objects - namespace, library - that must be tested; the environment is a special object 
with limited testable features. All objects must be tested in both development and production
modes.The latter mode includes cases where PMC flags are set.

The tests cases are divided into two groups, one for passing scenarios and one for failing.
Any test that needs a try-catch is a failing scenario in general, but as with everything, 
there are exceptions. A few such cases  might be found in passing group if the try-catch 
operation needs to be tested along with the other functionality; this also stops proliferation 
of cases.

In each group, the cases are sectioned based on objects. Sectioning simply means a noticable 
comment block. So, all record related passing cases are written sequentially, and so are the 
failing cases, but withing the respective groups.

Failing cases are of three kinds - syntax, semantic and functional - the third being runtime 
failure. Due to this, the cases are further sectioned into these three within the object section.

There are some tests for functionality that are same irrespective of the object, and such 
tests are put under 'common' section in both groups.

All cases are run for both environments, so, whevever relevant, every case must set its expected 
results based on the environment its running in, meaning, the env.IsDevMode must be used. If it 
is not used, it simply means that the behavior remains same in both modes.

Apart from these, there is a special set of cases to test pmc flags. This is relevant only for
production mode, so its better to separate as that would not only spares the same tests running 
twice in development mode, it also stops inflation of the case count.

For readability purposes, the cases are listed first and the mechanism code is at the end.

NOTE: The test case groups are basically a string->function map, the key being the test name and
the function being the code to run. Due to this, carelessness in naming the cases within a group
might lead to silent overrwriting, which causes loss of cases, so pay attention to the names.

*/
// todo: proper names and description, and neat formatting
 
JEEPTEST = {	
	passTests: {
		/***************************
		***** common
		****************************/
		"val-equal-native": function(env, cout, info){
			info.desc = "tests ValEqual with non JEEP objects"
			info.exp = ["ValEqual: false"];
			info.aspects = "core";
			cout("ValEqual:", JEEP.ValEqual(10, 10) ? "true":"false")
		},
		"val-equal-udt": function(env, cout, info){
			info.desc = "tests ValEqual with record and class"
			info.exp = ["ValEqual: true"];
			info.aspects = "core";
			let Record = env.CreateRecordDef("Record", {
				value: 0,
			});
			let Class = env.CreateClassDef("Class", {
				PUBLIC: {
					value: 10,
					print: function(){cout(this.$name, "value =", this.value)}
				}
			});
			let s = Record.InitNew({value: 10});
			let q = Class.New()
			cout("ValEqual:", JEEP.ValEqual(s,q) ? "true":"false")
		},
		/***************************
		***** record
		****************************/
		"record-basic": function(env, cout, info){
			info.desc = "tests the basic setup of record"
			info.exp = ["Test value = 10", "10"];
			info.aspects = "record";
			let Record = env.CreateRecordDef("Test", {
				value: 10,
				print: function(){cout(this.value)}// this is abuse of records but legal
			});
			let s = Record.New();
			cout(s.$name, "value =",s.value)
			s.print();
		},
		"record-sealed": function(env, cout, info){
			info.desc = "tests the basic setup of record"
			info.exp = ["Test number = undefined"];
			info.aspects = "record";
			let Record = env.CreateRecordDef("Test", {
				value: 10,
				print: function(){cout(this.value)}// this is abuse of records but legal
			});
			let s = Record.New();
			s.number = 100;
			cout(s.$name, "number =",Object.hasOwnProperty(s.number)?s.number:"undefined")
		},
		"record-register": function(env, cout, info){
			info.desc = "tests the registration mechanism for record"
			info.exp = ["Test value = 10"];
			info.aspects = "record";
			env.RegisterRecordDef("Test", {
				value: 10,
			});
			let Record = JEEP.GetObjectDef("Test");
			let s = Record.New();
			cout(s.$name, "value =",s.value)
		},
		"record-initnew": function(env, cout, info){
			info.desc = "tests the record InitNew mechanism"
			info.exp = ["Test value = 10 location = unknown"];
			info.aspects = "record";
			let Record = env.CreateRecordDef("Test", {
				value: 0,
				location: "unknown"
			});
			let s = Record.InitNew({value: 10});
			cout(s.$name, "value =",s.value, "location =", s.location)
		},
		"record-equal": function(env, cout, info){
			info.desc = "tests the record InitNew mechanism"
			info.exp = ["Equal: false", "ValEqual: true"];
			info.aspects = "record";
			let Record = env.CreateRecordDef("Test", {
				value: 0,
			});
			let Record2 = env.CreateRecordDef("Test", {
				value: 0,
			});
			let s = Record.InitNew({value: 10});
			let q = Record2.InitNew(s)
			cout("Equal:", JEEP.Equal(s,q) ? "true":"false")
			cout("ValEqual:", JEEP.ValEqual(s,q) ? "true":"false")
		},
		"record-extension": function(env, cout, info){
			info.desc = "tests the extension mechanism on records"
			info.exp = ["Test value = 10 number = 10 counter = -1"];
			info.aspects = "record";
			let First = env.CreateRecordDef("First", {
				value: 10,
			});
			env.RegisterRecordDef("Second", {
				number: 10,
			});
			let Record = env.CreateRecordDef("Test", {
				EXTENDS: [First, "Second"],
				counter: -1,
			});
			let s = Record.New();
			cout(s.$name, "value =",s.value, "number =", s.number, "counter =", s.counter)
		},
		/***************************
		***** struct
		****************************/
		"struct-basic": function(env, cout, info){
			info.desc = "tests the basic setup of structure"
			info.exp = ["Test value = 10"];
			info.aspects = "struct";
			let Struct = env.CreateStructDef("Test", {
				CONSTRUCTOR: function(x){this.value = x;},
				value: 0,
				print: function(){cout(this.$name, "value =", this.value)}
			});
			let s = Struct.New(10);
			s.number = 100;
			if(s.CONSTRUCTOR) throw "oops, struct instance has CONSTRUCTOR"
			if(s.number) throw "not sealed"
			s.print();
		},
		"struct-register": function(env, cout, info){
			info.desc = "tests the registration mechanism for structure"
			info.exp = ["Test value = 10"];
			info.aspects = "struct";
			env.RegisterStructDef("Test", {
				CONSTRUCTOR: function(x){this.value = x;},
				value: 0,
				print: function(){cout(this.$name, "value =", this.value)}
			});
			let Struct = JEEP.GetObjectDef("Test");
			let s = Struct.New(10);
			s.print();
		},
		"struct-instance": function(env, cout, info){
			info.desc = "tests that every struct instance has its own variables"
			info.exp = ["Test list = 10,20,30","Test list = 0,1,0"];
			info.aspects = "struct";
			let Struct = env.CreateStructDef("Test", {
				CONSTRUCTOR: function(ls){if(ls)this.list = ls},
				list: [10, 20, 30],
				print: function(){
					let s = this.list.join(',');
					cout(this.$name, "list =", s)
				}
			});
			let s = Struct.New();
			let s2 = Struct.New([0,0,0]);
			s2.list[1] = 1;
			s.print();
			s2.print();
		},
		"struct-instance-equal": function(env, cout, info){
			info.desc = "tests nstanceOf and Equal functions of structure"
			info.exp = ["InstanceOf: true", "Equal: true", "Equal: false", "Equal: false", "ValEqual: true"];
			info.aspects = "struct";
			let Struct = env.CreateStructDef("Test", {
				value: 10,
				print: function(){cout(this.$name, "value =", this.value)}
			});
			let s = Struct.New();
			cout("InstanceOf:", Struct.InstanceOf(s) ? "true":"false")
			let s2 = Struct.New();
			cout("Equal:", JEEP.Equal(s,s2) ? "true":"false")
			s.value++;
			cout("Equal:", JEEP.Equal(s,s2) ? "true":"false")
			let Struct2 = env.CreateStructDef("Test", {
				value: 10,
				print: function(){cout(this.$name, "value =", this.value)}
			});
			let c = Struct2.New();
			cout("Equal:", JEEP.Equal(c,s2) ? "true":"false")
			cout("ValEqual:", JEEP.ValEqual(c,s2) ? "true":"false")
		},
		"struct-initnew": function(env, cout, info){
			info.desc = "tests the InitNew mechanism"
			info.exp = ["Test value = 10", "Test value = 33"];
			info.aspects = "struct";
			let Struct = env.CreateStructDef("Test", {
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
		"struct-access": function(env, cout, info){
			info.desc = "tests the access restriction of structure"
			if(env.IsDevMode())
				info.exp = [
				"JEEP: Attempt to write private variable 'Test.value' detected.", 
				"JEEP: Attempt to access private function 'Test.change' detected.", 
				"Test value = 10"
				];
			else
				info.exp = ["Test value = -2"]
			info.aspects = "struct";
			let Struct = env.CreateStructDef("Test", {
				CONSTRUCTOR: function(x){this.change(x);},
				print: function(){cout(this.$name, "value =", this.value)},
				value__private: 0,
				change__private: function(v){this.value = v},
			});
			let s = Struct.New(10);
			try{s.value = -1}catch(e){cout(e)}
			try{s.change(-2)}catch(e){cout(e)}
			s.print();			
		},
		"struct-access-otherinstance": function(env, cout, info){
			info.desc = "tests the access restriction of structure is not applicable to another instance of the same structure"
			info.exp = ["Test value = 100"]
			info.aspects = "struct, access";
			let Struct = env.CreateStructDef("Test", {
				CONSTRUCTOR: function(x){this.change(x);},
				print: function(inst){cout(inst.$name, "value =", inst.value)},
				value__private: 0,
				change__private: function(v){this.value = v},
			});
			let s = Struct.New().print(Struct.New(100));
		},
		/***************************
		***** class
		****************************/
		/* TODO - layout optimization
		"class-layout": function(env, cout, info){
			info.desc = "tests the basic setup of class that has public variables, functions and constructor that takes initial value"
			info.exp = ["Test", "value = 100"];
			info.aspects = "class";
			let Class = env.CreateClassDef("Test", {
				CONSTRUCTOR: function(x){
					cout(this.$name)
					this.value = x;
				},
				PUBLIC: {
					value: 10,
					print: function(){cout("value =", this.value)}
				}
			});
			let c = Class.New(100);
			c.print();
			let keys = Object.keys(c);
			for(let k = 0; k<keys.length; k++){
				let dp = Object.getOwnPropertyDescriptor(c, keys[k])
				if(dp.get || dp.set)
					cout(keys[k]," has get set property")
			}
		},
		*/
		"class-basic": function(env, cout, info){
			info.desc = "tests the basic setup of class that has public variables, functions and constructor that takes initial value"
			info.exp = ["Test", "value = 100"];
			info.aspects = "class";
			let Class = env.CreateClassDef("Test", {
				CONSTRUCTOR: function(x){
					cout(this.$name)
					this.value = x;
				},
				PUBLIC: {
					value: 10,
					print: function(){cout("value =", this.value)}
				}
			});
			let c = Class.New(100);
			c.number = 100;
			if(c.number) throw "not sealed"
			c.print();
		},
		"class-underscore-memname": function(env, cout, info){
			info.desc = "tests the basic setup of class that has public variables, functions and constructor that takes initial value"
			info.exp = ["Test", "value = 100"];
			info.aspects = "class";
			let Class = env.CreateClassDef("Test", {
				CONSTRUCTOR: function(x){
					cout(this.$name)
					this.value_ = x;
				},
				PUBLIC: {
					value_: 10,
					print__: function(){cout("value =", this.value_)}
				}
			});
			let c = Class.New(100);
			c.print__();
		},
		"class-check-instanceof": function(env, cout, info){
			info.desc = "tests the basic setup of class that has public variables, functions and constructor that takes initial value"
			info.exp = [
			"c instance of Class: true", 
			"d instance of Class: false",
			"c instance of Class2: false", 
			"d instance of Class2: true"
			];
			info.aspects = "class";
			let Class = env.CreateClassDef("Test", {
				CONSTRUCTOR: function(x){
					this.value = x;
				},
				PUBLIC: {
					value: 10,
					print: function(){cout("value =", this.value)}
				}
			});
			let Class2 = env.CreateClassDef("Test", {
				CONSTRUCTOR: function(x){
					this.value = x;
				},
				PUBLIC: {
					value: 10,
					print: function(){cout("value =", this.value)}
				}
			});
			let c = Class.New(100);
			let d = Class2.New()
			cout("c instance of Class:", Class.InstanceOf(c)?"true":"false")
			cout("d instance of Class:", Class.InstanceOf(d)?"true":"false")
			cout("c instance of Class2:", Class2.InstanceOf(c)?"true":"false")
			cout("d instance of Class2:", Class2.InstanceOf(d)?"true":"false")
		},
		"class-equal": function(env, cout, info){
			info.desc = "tests Equal functions of class"
			info.exp = ["Equal: true", "Equal: false", "Equal: false", "ValEqual: true"];
			info.aspects = "struct";
			let Class = env.CreateClassDef("Class", {
				PUBLIC: {
					value: 10,
					print: function(){cout(this.$name, "value =", this.value)}
				}
			});
			let Class2 = env.CreateClassDef("Class", {
				PUBLIC: {
					value: 10,
					print: function(){cout(this.$name, "value =", this.value)}
				}
			});
			let s = Class.New();
			let s2 = Class.New();
			cout("Equal:", JEEP.Equal(s,s2) ? "true":"false")
			s.value++;
			cout("Equal:", JEEP.Equal(s,s2) ? "true":"false")
			let c = Class2.New();
			cout("Equal:", JEEP.Equal(c,s2) ? "true":"false")
			cout("ValEqual:", JEEP.ValEqual(c,s2) ? "true":"false")
		},
		"class-register": function(env, cout, info){
			info.desc = "tests the registration mechanism for class"
			info.exp = ["value = 10"];
			info.aspects = "class";
			env.RegisterClassDef("Test", {
				PUBLIC: {
					value: 10,
					print: function(){cout("value =", this.value)}
				}
			});
			let Class = JEEP.GetObjectDef("Test");
			let c = Class.New();
			c.print();
		},
		"class-typedef": function(env, cout, info){
			info.desc = "tests the type mechanism with class (is same for record and struct)"
			info.exp = ["value = 10"];
			info.aspects = "class";
			env.RegisterClassDef("Test", {
				PUBLIC: {
					value: 10,
					print: function(){cout("value =", this.value)}
				}
			});
			JEEP.Typedef("MyCLass", "Test");
			let Class = JEEP.GetObjectDef("MyCLass");
			let c = Class.New();
			c.print();
		},
		"class-instance": function(env, cout, info){
			info.desc = "tests that each instance has its own copy of variables (pod, string, array and object)"
			info.exp = [
			"value = 10 text = first list[1] = 1 obj = {\"num\":100,\"name\":\"name\",\"vals\":[0,1,2],\"sub\":{\"n\":1}}",
			"value = 20 text = first-second list[1] = 2 obj = {\"num\":200,\"name\":\"name\",\"vals\":[0,1,2],\"sub\":{\"n\":1}}",
			"value = 10 text = first list[1] = 1 obj = {\"num\":100,\"name\":\"name\",\"vals\":[0,1,2],\"sub\":{\"n\":1}}"
			];
			info.aspects = "class";
			let Class = env.CreateClassDef("Test", {
				PUBLIC: {
					value: 10,
					text: "first",
					list: [0,1,2],
					obj: {
						num: 100,
						name: "name",
						vals: [0,1,2],
						sub: {
							n: 1
						}
					},
					print: function(){cout("value =", this.value, "text =", this.text, "list[1] =", this.list[1], "obj =", JSON.stringify(this.obj))}
				}
			});
			let c = Class.New();
			c.print();
			let d = Class.New();
			d.value = 20;
			d.text += "-second";
			d.list[1] = 2;
			d.obj.num = 200;
			d.print();
			c.print();
		},
		"class-initnew": function(env, cout, info){
			info.desc = "tests class initnew"
			info.exp = ["info: Jacob 1234567 <nocity>", "info: <noname> 10 neverland"];
			info.aspects = "class";
			env.RegisterClassDef("Test", {
				CONSTRUCTOR: function(x){
					if(!this.$initnew){
						this.name = "Jacob"
						this.age = 1234567;
					}
					this.print();
				},
				PUBLIC: {
					name: "<noname>",
					age: 0,
					city: "<nocity>",
					print: function(){cout("info:", this.name, this.age, this.city)}
				}
			});
			let Class = JEEP.GetObjectDef("Test");
			Class.New();
			Class.InitNew({age: 10, city: "neverland"})
		},
		"class-new-initnew": function(env, cout, info){
			info.desc = "tests class initnew"
			info.exp = ["info: Jacob 1234567 <nocity>", "info: <noname> 10 neverland"];
			info.aspects = "class";
			env.RegisterClassDef("Test", {
				CONSTRUCTOR: function(x){
					if(!this.$initnew){
						this.name = "Jacob"
						this.age = 1234567;
					}
					this.print();
				},
				PUBLIC: {
					name: "<noname>",
					age: 0,
					city: "<nocity>",
					print: function(){cout("info:", this.name, this.age, this.city)}
				}
			});
			let Class = JEEP.GetObjectDef("Test");
			Class.New();
			Class.New({age: 10, city: "neverland"})
		},
		"class-getter-setter": function(env, cout, info){
			info.desc = "tests the basic setup of class that has public variables, functions and constructor that takes initial value"
			info.exp = ["Test", "value = 110", "-1 33"];
			info.aspects = "class";
			let Class = env.CreateClassDef("Test", {
				CONSTRUCTOR: function(x){
					cout(this.$name)
					this.value = x;
				},
				PUBLIC: {
					value__get_set: 10,
					print: function(){cout("value =", this.value)}
				},
				PROTECTED: {
					protval__get_set: 33,
				},
				PRIVATE: {
					privval__get_set: -1,
				}
			});
			let c = Class.New(100);
			let v = c.getValue();
			c.setValue(v + 10)
			c.print();
			cout(c.getPrivval(), c.getProtval());
		},
		"class-copy-constructor-basic": function(env, cout, info){
			info.desc = "tests copy construction mechanism for class"
			info.exp = ["CONSTRUCTOR 20","value = 20", "value = 100"];
			info.aspects = "class";
			env.RegisterClassDef("Test", {
				CONSTRUCTOR: function(x){
					cout("CONSTRUCTOR",x);
					this.value = x;
				},
				PUBLIC: {
					value: 10,
					print: function(){cout("value =", this.value)}
				}
			});
			let Class = JEEP.GetObjectDef("Test");
			let c = Class.New(20);
			c.print();
			c.value = 100;
			let d = Class.New(c);
			d.print();
		},
		"class-copy-constructor-virtual": function(env, cout, info){
			info.desc = "tests copy construction mechanism for class with virtual functions"
			info.exp = [
			"Base CONSTRUCTOR 20", "Derived CONSTRUCTOR 20",
			"Derived value = 20", "Derived value = 100"];
			info.aspects = "class";
			env.RegisterClassDef("Base", {
				CONSTRUCTOR: function(x){
					cout("Base CONSTRUCTOR",x);
					this.value = x;
				},
				PUBLIC: {
					value: 10,
					print__virtual: function(){cout("Base value =", this.value)}
				}
			});
			let Derived = env.CreateClassDef("Derived", {
				EXTENDS: ["Base"],
				CONSTRUCTOR: function(x){
					cout("Derived CONSTRUCTOR",x)
				},
				PUBLIC: {
					print__virtual: function(){cout("Derived value =", this.value)}
				}
			});
			let c = Derived.New(20);
			c.print();
			c.value = 100;
			let d = Derived.New(c);
			d.print();
		},
		"class-flexi-init": function(env, cout, info){
			info.desc = "tests copy construction mechanism for class with virtual functions"
			info.exp = [
			"InitNew mechanism invoked", "value: 100",
			"value: 200",
			"constructing...", "value: 300"
			],
			info.aspects = "class";
			let Class = env.CreateClassDef("Class", {
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
		"class-managed": function(env, cout, info){
			info.desc = "tests managed lifetime (with nested calls)"
			info.exp = [
				"Resource 200 CONSTRUCTOR", 
				"Resource -1 CONSTRUCTOR", 
				"Resource -1 DESTRUCTOR", 
				"Resource 200 DESTRUCTOR", 
				];
			info.aspects = "class, managed";
			let Resource = env.CreateClassDef("Resource", {
				CONSTRUCTOR__managed: function(x){
					this.value = x;
					cout(this.$name + " " + this.value + " CONSTRUCTOR")
				},
				DESTRUCTOR: function(){
					cout(this.$name + " " + this.value + " DESTRUCTOR")
				},
				PUBLIC: {
					value: 10,
					work__managed: function(){
						this.$def.New(-1);
					}
				}
			});
			let Class = env.CreateClassDef("Class", {
				PUBLIC: {
					dummyvar: 0,
					test__managed: function(){
						let r = Resource.New(200);
						r.work();
					}
				}
			});
			let c = Class.New();
			c.test();
		},
		"class-access-setup": function(env, cout, info){
			info.desc = "tests basic setup of class access modifiers";
			info.exp = ["pubval: 1", "privval: 3", "protval: 2", "privval: 3"];
			info.aspects = "class, access";
			let Class = env.CreateClassDef("Test", {
				PUBLIC: {
					pubval: 1,
					pubprint: function(){
						cout("pubval:",this.pubval);
						this.pubprint2();
						this.protprint();
					},
					pubprint2: function(){
						this.privprint();
					}
				},
				PROTECTED: {
					protval: 2,
					protprint: function(){
						cout("protval:",this.protval);
						this.privprint();
					},
				},
				PRIVATE: {
					privval: 3,
					privprint: function(){
						cout("privval:",this.privval)
					}
				}
			})
			let c = Class.New();
			c.pubprint();
		},
		"class-access-other-instance": function(env, cout, info){
			info.desc = "tests basic setup of class access modifiers";
			info.exp = ["privval: 3"];
			info.aspects = "class, access";
			let Class = env.CreateClassDef("Test", {
				PUBLIC: {
					pubval: 1,
					use: function(other){
						other.privprint();
					}
				},
				PRIVATE: {
					privval: 3,
					privprint: function(){
						cout("privval:",this.privval)
					}
				}
			})
			let c = Class.New();
			c.use(Class.New());
		},
		"class-access-external-recall": function(env, cout, info){
			info.desc = "tests public->external->private call doesn't affect access restriction";
			if(env.IsDevMode())
				info.exp = ["privprint", 
				"JEEP: Attempt to invoke private function 'Test.privprint' detected.",
				 "privprint"];
			else
				info.exp = ["privprint", "privprint", "privprint"]
			info.aspects = "class, access";
			let Class = env.CreateClassDef("Test", {
				PUBLIC: {
					pubval: 1,
					pubprint: function(f){
						this.privprint();
						this.ExternalCall(f,this);
					},
					pubprint2: function(){
						this.privprint();
					}
				},
				PRIVATE: {
					privprint: function(){
						cout("privprint")
					}
				}
			})
			let c = Class.New();
			c.pubprint(function f(x){
				try{x.privprint()}catch(e){cout(e)}
				x.pubprint2();
			});
		},
		"class-const-var-ctor": function(env, cout, info){
			info.desc = "tests that constant variable can be set in constructor"
			info.exp = ["0"]
			info.aspects = "class, function directive";
			let Class = env.CreateClassDef("Test", {
				CONSTRUCTOR: function(){this.value = 0},
				PUBLIC: {
					value__const: 10,
					obj__const: {a: 10},
					funcA: function(f){f(this)}
				}
			});
			let c = Class.New();
			cout(c.value)
		},
		"class-argnum": function(env, cout, info){
			info.desc = "tests the argnum directive, validating arguments count"
			info.exp = ["ok"];
			info.aspects = "class, function directive";
			let Class = env.CreateClassDef("Test", {
				PUBLIC: {
					dummyvar: 0,
					func__argnum: function(f, g){cout("ok")}
				}
			});
			let c = Class.New();
			c.func(0,0);
		},
		"class-argnumvar": function(env, cout, info){
			info.desc = "tests the argnumvar directive, validating arguments count"
			info.exp = ["ok"];
			info.aspects = "class, function directive";
			let Class = env.CreateClassDef("Test", {
				PUBLIC: {
					dummyvar: 0,
					func__argnumvar: function(f, g){cout("ok")}
				}
			});
			let c = Class.New();
			c.func(0,0,0);
		},
		"class-argtype": function(env, cout, info){
			info.desc = "tests the argtype directive, validating arguments type"
			info.exp = ["1 1 1,2 {\"c\":1}"];
			info.aspects = "class, function directive";
			let Class = env.CreateClassDef("Test", {
				PUBLIC: {
					dummyvar: 0,
					func__argtype: function(n__number, s__string, a__array, ob__object){
						return function(n,s,a,ob){
							cout(n,s,a,JSON.stringify(ob))
						}
					}
				}
			});
			let c = Class.New();
			c.func(1,"1",[1,2],{c:1});
		},
		"class-argtype-udt": function(env, cout, info){
			info.desc = "tests the argtype directive with user defined data types"
			info.exp = ["ok"];
			info.aspects = "class, function directive";
			env.RegisterRecordDef('Record', {value: 10});
			env.RegisterStructDef('Struct', {value: 10, func: function(){}});
			JEEP.Typedef("struct", "Struct");
			JEEP.Typedef("rec", "Record");
			let Class = env.CreateClassDef("Test", {
				PUBLIC: {
					dummyvar: 0,
					func__argtype: function(s__struct, r__rec){
						return function(s,r){
							cout("ok")
						}
					}
				}
			});
			let c = Class.New();
			c.func(JEEP.GetObjectDef("Struct").New(), JEEP.GetObjectDef("Record").New());
		},
		"class-argtype-udt-derived": function(env, cout, info){
			info.desc = "tests the argtype directive with user defined data types"
			info.exp = ["TopBase value: 10"];
			info.aspects = "class, function directive";
			env.RegisterClassDef("TopBase", {
				CONSTRUCTOR: function(){},
				PUBLIC: {
					value: 10,
					print: function(){cout("TopBase value:", this.value)}
				}
			});
			env.RegisterClassDef("Derived", {
				EXTENDS: ["TopBase"],
				CONSTRUCTOR: function(){},
				PUBLIC: {
					dvalue: 10,
					dprint: function(){
						this.mprint();
						cout("Derived value:", this.dvalue)
					}
				}
			});
			let Class = env.CreateClassDef("Test", {
				PUBLIC: {
					dummyvar: 0,
					func__argtype: function(tb__TopBase){
						return function(tb){
							tb.print()
						}
					}
				}
			});
			let c = Class.New();
			c.func(JEEP.GetObjectDef("Derived").New());
		},
		"class-argtype-any": function(env, cout, info){
			info.desc = "tests the argtype directive, validating arguments type"
			info.exp = ["1 1", "1 \"1\"", "1 [1,2]", "1 {\"c\":1}"];
			info.aspects = "class, function directive";
			let Class = env.CreateClassDef("Test", {
				PUBLIC: {
					dummyvar: 0,
					func__argtype: function(n__number, ob){
						return function(n,ob){
							cout(n,JSON.stringify(ob))
						}
					}
				}
			});
			let c = Class.New();
			c.func(1,1);
			c.func(1,"1");
			c.func(1,[1,2]);
			c.func(1,{c:1});
		},
		"class-single-inheritance-basic": function(env, cout, info){
			info.desc = "tests the single inheritance setup with public members and constructors (TopBase, MidBase and Derived)"
			info.exp = ["TopBase CONSTRUCTOR", "MidBase CONSTRUCTOR", "Derived CONSTRUCTOR", "TopBase value: 10", "MidBase value: 10", "Derived value: 10"];
			info.aspects = "class, inheritance";
			let TopBase = env.CreateClassDef("TopBase", {
				CONSTRUCTOR: function(){cout("TopBase CONSTRUCTOR")},
				PUBLIC: {
					value: 10,
					print: function(){cout("TopBase value:", this.value)}
				}
			});
			let MidBase = env.CreateClassDef("MidBase", {
				EXTENDS: [TopBase],
				CONSTRUCTOR: function(){cout("MidBase CONSTRUCTOR")},
				PUBLIC: {
					mvalue: 10,
					mprint: function(){
						this.print();
						cout("MidBase value:", this.dvalue)
					}
				}
			});
			let Derived = env.CreateClassDef("Derived", {
				EXTENDS: [MidBase],
				CONSTRUCTOR: function(){cout("Derived CONSTRUCTOR")},
				PUBLIC: {
					dvalue: 10,
					dprint: function(){
						this.mprint();
						cout("Derived value:", this.dvalue)
					}
				}
			});
			let d = Derived.New();
			d.dprint();
		},
		"class-check-instanceof-single-inheritance": function(env, cout, info){
			info.desc = "tests the single inheritance setup with public members and constructors (TopBase, MidBase and Derived)"
			info.exp = [
			"c instance of TopBase: true", 
			"c instance of MidBase: true",
			];
			info.aspects = "class, inheritance";
			let TopBase = env.CreateClassDef("TopBase", {
				CONSTRUCTOR: function(){},
				PUBLIC: {
					value: 10,
					print: function(){cout("TopBase value:", this.value)}
				}
			});
			let MidBase = env.CreateClassDef("MidBase", {
				EXTENDS: [TopBase],
				CONSTRUCTOR: function(){},
				PUBLIC: {
					mvalue: 10,
					mprint: function(){
						this.print();
						cout("MidBase value:", this.dvalue)
					}
				}
			});
			let Derived = env.CreateClassDef("Derived", {
				EXTENDS: [MidBase],
				CONSTRUCTOR: function(){},
				PUBLIC: {
					dvalue: 10,
					dprint: function(){
						this.mprint();
						cout("Derived value:", this.dvalue)
					}
				}
			});
			let c = Derived.New();
			cout("c instance of TopBase:", TopBase.InstanceOf(c)?"true":"false")
			cout("c instance of MidBase:", MidBase.InstanceOf(c)?"true":"false")
		},
		"class-single-inheritance-protected-access": function(env, cout, info){
			info.desc = "tests that protected members are accessible from derived class in  3 level single inheritance";
			info.exp = ["TopBase value: 10", "MidBase value: 10", "Derived value: 10"];
			info.aspects = "class, inheritance";
			let TopBase = env.CreateClassDef("TopBase", {
				PROTECTED: {
					value: 10,
					print: function(){this.privprint()}
				},
				PRIVATE: {
					privprint: function(){cout("TopBase value:", this.value)}
				}
			});
			let MidBase = env.CreateClassDef("MidBase", {
				EXTENDS: [TopBase],
				PROTECTED: {
					mvalue: 10,
					mprint: function(){
						this.print();
						cout("MidBase value:", this.dvalue)
					}
				}
			});
			let Derived = env.CreateClassDef("Derived", {
				EXTENDS: [MidBase],
				PUBLIC: {
					dvalue: 10,
					dprint: function(){
						this.mprint();
						cout("Derived value:", this.dvalue)
					}
				}
			});
			let d = Derived.New();
			d.dprint();
		},
		"class-virtual-function-basic": function(env, cout, info){
			info.desc = "tests virtual function mechanism in a three level single inheritance along with $base usage",
			info.exp = [
			"TopBase value: 10", 
			"TopBase value: 10",  "MidBase value: 20", 
			"TopBase value: 10",  "MidBase value: 20", "Derived value: 30"
			];
			info.aspects = "class, inheritance, virtual";
			let TopBase = env.CreateClassDef("TopBase", {
				PUBLIC: {
					value: 10,
					print: function(){this.doprint()},
					doprint__virtual: function(){cout("TopBase value:", this.value)},
				}
			});
			let MidBase = env.CreateClassDef("MidBase", {
				EXTENDS: [TopBase],
				PUBLIC: {
					mvalue: 20,
					doprint__virtual: function(){
						this.$base.TopBase.doprint();
						cout("MidBase value:", this.mvalue)
					}
				}
			});
			let Derived = env.CreateClassDef("Derived", {
				EXTENDS: [MidBase],
				PUBLIC: {
					dvalue: 30,
					doprint__virtual: function(){
						this.$base.MidBase.doprint();
						cout("Derived value:", this.dvalue)
					}
				}
			});
			TopBase.New().print();
			MidBase.New().print();
			Derived.New().print();
		},
		"class-virtual-function-more": function(env, cout, info){
			info.desc = "tests that top level virtual function is available to lower levels classes in a four level single inheritance",
			info.exp = ["TopBase action1","MidBase action2","LowBase action3","Derived action4"],
			info.aspects = "class, inheritance, virtual";
			let TopBase = env.CreateClassDef("TopBase", {
				PUBLIC: {
					dummyvar: 0,
					work: function(){
						this.action1()
						this.action2()
						this.action3()
						this.action4()
					},
					action1__virtual: function(){cout("TopBase action1")},
					action2__virtual: function(){cout("TopBase action2")},
					action3__virtual: function(){cout("TopBase action3")},
					action4__virtual: function(){cout("TopBase action4")},
				}
			});
			let MidBase = env.CreateClassDef("MidBase", {
				EXTENDS: [TopBase],
				PUBLIC: {
					action2__virtual: function(){cout("MidBase action2")},
					action3__virtual: function(){cout("MidBase action3")},
					action4__virtual: function(){cout("MidBase action4")},
				}
			});
			let LowBase = env.CreateClassDef("LowBase", {
				EXTENDS: [MidBase],
				PUBLIC: {
					action3__virtual: function(){cout("LowBase action3")},
					action4__virtual: function(){cout("LowBase action4")},
				}
			});
			let Derived = env.CreateClassDef("Derived", {
				EXTENDS: [LowBase],
				PUBLIC: {
					action4__virtual: function(){cout("Derived action4")},
				}
			});
			(Derived.New()).work();
		},
		"class-virtual-function-private": function(env, cout, info){
			info.desc = "tests private virtual function behavior",
			info.exp = ["Derived action1"],
			info.aspects = "class, inheritance, virtual";
			let TopBase = env.CreateClassDef("TopBase", {
				PUBLIC: {
					dummyvar: 0,
					work: function(){
						this.action1()
					},
				},
				PRIVATE: {
					action1__virtual: function(){cout("TopBase action1")},
				}
			});
			let Derived = env.CreateClassDef("Derived", {
				EXTENDS: [TopBase],
				PRIVATE: {
					action1__virtual: function(){cout("Derived action1")},
				}
			});
			(Derived.New()).work();
		},
		"class-virtual-function-baseobj": function(env, cout, info){
			info.desc = "tests that the $base object contains only relevant functions (no abstract and private virtual)",
			info.exp = [
			"TopBase present", "TopBase.action1 not present", "TopBase.action2 present", 
			"MidBase present", "MidBase.action1 not present", "MidBase.action2 present",
			"LowBase not present",
			];
			info.aspects = "class, inheritance, virtual";
			let TopBase = env.CreateClassDef("TopBase", {
				PUBLIC: {
					dummyvar: 0,
					action1__abstract: function(){},
					action2__virtual: function(){},
				}
			});
			let MidBase = env.CreateClassDef("MidBase", {
				EXTENDS: [TopBase],
				PUBLIC: {
					action2__virtual: function(){},
				}
			});
			let LowBase = env.CreateClassDef("LowBase", {
				EXTENDS: [MidBase],
				PUBLIC: {
					action3: function(){},
				}
			});
			let Derived = env.CreateClassDef("Derived", {
				EXTENDS: [LowBase],
				PUBLIC: {
					action1__virtual: function(){},
				}
			});

			let d = Derived.New();

			if(d.$base.TopBase){
				cout("TopBase present")
				cout(d.$base.TopBase.action1 ? "TopBase.action1 present" : "TopBase.action1 not present");
				cout(d.$base.TopBase.action2 ? "TopBase.action2 present" : "TopBase.action2 not present");
			} else cout("TopBase not present")

			if(d.$base.MidBase){
				cout("MidBase present")
				cout(d.$base.MidBase.action1 ? "MidBase.action1 present" : "MidBase.action1 not present");
				cout(d.$base.MidBase.action2 ? "MidBase.action2 present" : "MidBase.action2 not present");
			} else cout("MidBase not present")

			if(d.$base.LowBase){
				cout("LowBase present")
				cout(d.$base.LowBase.action1 ? "LowBase.action1 present" : "LowBase.action1 not present");
				cout(d.$base.LowBase.action2 ? "LowBase.action2 present" : "LowBase.action2 not present");
			} else cout("LowBase not present")
		},
		"class-virtual-function-private-baseobj": function(env, cout, info){
			info.desc = "tests that $base won't have private virtual function",
			info.exp = ["$base not present"],
			info.aspects = "class, inheritance, virtual";
			let TopBase = env.CreateClassDef("TopBase", {
				PUBLIC: {
					dummyvar: 0,
					work: function(){
						this.action1()
					},
				},
				PRIVATE: {
					action1__virtual: function(){cout("TopBase action1")},
				}
			});
			let Derived = env.CreateClassDef("Derived", {
				EXTENDS: [TopBase],
				PRIVATE: {
					action1__virtual: function(){cout("Derived action1")},
				}
			});
			let d = Derived.New();
			if(d.$base){cout("$base present")
			if(d.$base.TopBase){
				cout("TopBase present")
				cout(d.$base.TopBase.action1 ? "TopBase.action1 present" : "TopBase.action1 not present");
			} else cout("TopBase not present")
			} else cout("$base not present")
		},
		"class-abstract-function": function(env, cout, info){
			info.desc = "tests abstract function mechanism"
			info.exp = ["action1","action2"];
			info.aspects = "class, inheritance, abstract";
			let TopBase = env.CreateClassDef("TopBase", {
				PUBLIC: {
					dummyvar: 0,
					work: function(){this.action1(); this.action2()}
				},
				PRIVATE: {
					action1__abstract: function(){}
				}
			});
			let MidBase = env.CreateClassDef("MidBase", {
				EXTENDS: [TopBase],
				PRIVATE: {
					action2__abstract: function(){}
				}
			});
			let Derived = env.CreateClassDef("Derived", {
				EXTENDS: [MidBase],
				PRIVATE: {
					action1__virtual: function(){cout("action1")},
					action2__virtual: function(){cout("action2")}
				}
			});
			(Derived.New()).work()
		},
		"class-multiple-inheritance": function(env, cout, info){
			info.desc = "tests multiple inheritance with abstract functions in single level with one base registered"
			info.exp = ["actionA","actionB"];
			info.aspects = "class, inheritance, abstract";
			env.RegisterClassDef("BaseA", {
				PUBLIC: {
					dummyvar: 0,
					workA: function(){this.actionA();}
				},
				PRIVATE: {
					actionA__abstract: function(){}
				}
			});
			let BaseB = env.CreateClassDef("BaseB", {
				PUBLIC: {
					dummyvar2: 0,
					workB: function(){this.actionB()}
				},
				PRIVATE: {
					actionB__abstract: function(){}
				}
			});
			let Derived = env.CreateClassDef("Derived", {
				EXTENDS: ["BaseA", BaseB],
				PUBLIC: {
					work: function(){this.workA();this.workB()}
				},
				PRIVATE: {
					actionA__virtual: function(){cout("actionA")},
					actionB__virtual: function(){cout("actionB")}
				}
			});
			(Derived.New()).work()
		},
		"class-diamond-inheritance": function(env, cout, info){
			info.desc = "tests multiple inheritance with abstract functions in single level with one base registered"
			info.exp = ["TopBase constructor","action","actionA","actionB", "TopBase destructor"];
			info.aspects = "class, inheritance, abstract";
			env.RegisterClassDef("TopBase", {
				CONSTRUCTOR__managed: function(){cout("TopBase constructor")},
				DESTRUCTOR: function(){cout("TopBase destructor")},
				PUBLIC: {
					dummyvar: 0,
					work: function(){this.action();}
				},
				PRIVATE: {
					action__abstract: function(){}
				}
			});
			env.RegisterClassDef("BaseA", {
				EXTENDS: ["TopBase"],
				PUBLIC: {
					dummyvar1: 0,
					workA: function(){this.actionA();}
				},
				PRIVATE: {
					actionA__abstract: function(){}
				}
			});
			let BaseB = env.CreateClassDef("BaseB", {
				EXTENDS: ["TopBase"],
				PUBLIC: {
					dummyvar2: 0,
					workB: function(){this.actionB()}
				},
				PRIVATE: {
					actionB__abstract: function(){}
				}
			});
			let Derived = env.CreateClassDef("Derived", {
				EXTENDS: ["BaseA", BaseB],
				PUBLIC: {
					dwork: function(){this.work();this.workA();this.workB()}
				},
				PRIVATE: {
					action__virtual: function(){cout("action")},
					actionA__virtual: function(){cout("actionA")},
					actionB__virtual: function(){cout("actionB")}
				}
			});
			let obj = {};
			env.CreateField(obj, "Field", {
				test__managed: function(){
					(Derived.New()).dwork()
				},
			});
			obj.test();			
		},
		"class-check-instanceof-diamond-inheritance": function(env, cout, info){
			info.desc = "tests multiple inheritance with abstract functions in single level with one base registered"
			info.exp = [
			"c instance of TopBase: true", 
			"c instance of BaseA: true",
			"c instance of BaseB: true", 
			];
			info.aspects = "class, inheritance, abstract";
			env.RegisterClassDef("TopBase", {
				PUBLIC: {
					dummyvar: 0,
					work: function(){this.action();}
				},
				PRIVATE: {
					action__abstract: function(){}
				}
			});
			env.RegisterClassDef("BaseA", {
				EXTENDS: ["TopBase"],
				PUBLIC: {
					dummyvar1: 0,
					workA: function(){this.actionA();}
				},
				PRIVATE: {
					actionA__abstract: function(){}
				}
			});
			let BaseB = env.CreateClassDef("BaseB", {
				EXTENDS: ["TopBase"],
				PUBLIC: {
					dummyvar2: 0,
					workB: function(){this.actionB()}
				},
				PRIVATE: {
					actionB__abstract: function(){}
				}
			});
			let Derived = env.CreateClassDef("Derived", {
				EXTENDS: ["BaseA", BaseB],
				PUBLIC: {
					dwork: function(){this.work();this.workA();this.workB()}
				},
				PRIVATE: {
					action__virtual: function(){cout("action")},
					actionA__virtual: function(){cout("actionA")},
					actionB__virtual: function(){cout("actionB")}
				}
			});
			let TopBase = JEEP.GetObjectDef("TopBase")
			let BaseA = JEEP.GetObjectDef("BaseA")
			let c = Derived.New();
			cout("c instance of TopBase:", TopBase.InstanceOf(c)?"true":"false")
			cout("c instance of BaseA:", BaseA.InstanceOf(c)?"true":"false")
			cout("c instance of BaseB:", BaseB.InstanceOf(c)?"true":"false")
		},
		"class-wrapper-basic": function(env, cout, info){
			info.desc = "tests the wraper mechanism with a simple one level single inheritance (with variable read/write, constructor and congifurability)",
			info.exp = [
			"TopBase.value present", 
			"TopBase.number not present",
			"TopBase.perform() present", 
			"TopBase.runTasks() not present", 
			"Derived.value not present", 
			"Derived.number present",
			"Derived.perform() not present",
			"Derived.runTasks() present", 
			"performing 100 20", 
			"performing 200 20", 
			"working 300 20",
			],
			info.aspects = "class, inheritance, wrapper";
			env.RegisterClassDef("TopBase", {
				CONSTRUCTOR: function(x){this.value = x},
				PUBLIC: {
					value: 37,
					start: function(x){this.perform(x)},
					perform: function(x){cout("performing", x, this.value)},
				}
			});
			let Wrapper = env.CreateClassWrapper("TopBase", {
				Functions: {
					"perform": "runTasks"
				},
				Variables: {
					"value": "number"
				}
			})
			let Derived = env.CreateClassDef("Derived", {
				EXTENDS: [Wrapper],
				CONSTRUCTOR: function(x){this.number *= 2},
				PUBLIC: {
					work: function(x){cout("working", x, this.number)},
				}
			});
			let checker = Object.getOwnPropertyDescriptor;
			// make sure te wrapped class is untouched
			let t = JEEP.GetObjectDef("TopBase").New(10);
			cout("TopBase.value", checker(t, "value") ?  "present" : "not present");
			cout("TopBase.number", checker(t, "number") ?  "present" : "not present");
			cout("TopBase.perform()", checker(t, "perform") ?  "present" : "not present");
			cout("TopBase.runTasks()", checker(t, "runTasks") ?  "present" : "not present");
			let d = Derived.New(10);
			cout("Derived.value", checker(d, "value") ?  "present" : "not present");
			cout("Derived.number", checker(d, "number") ?  "present" : "not present");
			cout("Derived.perform()", checker(d, "perform") ?  "present" : "not present");
			cout("Derived.runTasks()", checker(d, "runTasks") ?  "present" : "not present");
			d.runTasks(100);
			d.start(200);
			d.work(300);
			// try{
			// 	Object.defineProperty(d, "number", {
			// 		configurable: true,
			// 		enumerable: true,
			// 		get: function(v){},
			// 		set: function(v){},
			// 	});
			// }catch(e){cout("wrapped unconfigurable")}
		},
		"class-check-instanceof-wrapper": function(env, cout, info){
			info.desc = "tests the single inheritance setup with public members and constructors (TopBase, MidBase and Derived)"
			info.exp = [
			"c instance of TopBase: false", 
			];
			info.aspects = "class, inheritance";
			env.RegisterClassDef("TopBase", {
				CONSTRUCTOR: function(){},
				PUBLIC: {
					value: 10,
					print: function(){cout("TopBase value:", this.value)}
				}
			});
			let Wrapper = env.CreateClassWrapper("TopBase", {
				Functions: {
					"print": "show"
				},
				Variables: {
					"value": "number"
				}
			})
			let Derived = env.CreateClassDef("Derived", {
				EXTENDS: [Wrapper],
				CONSTRUCTOR: function(){},
				PUBLIC: {
					dvalue: 10,
					dprint: function(){
						this.mprint();
						cout("Derived value:", this.dvalue)
					}
				}
			});
			let c = Derived.New();
			let TopBase = JEEP.GetObjectDef("TopBase")
			cout("c instance of TopBase:", TopBase.InstanceOf(c)?"true":"false")
		},
		"class-wrapper-with-virtual": function(env, cout, info){
			info.desc = "tests the wrapper mechanism with private virtual functions with a simple one level single inheritance",
			info.exp = ["Derived action1 100", "Derived action1 200"],
			info.aspects = "class, inheritance, wrapper";
			env.RegisterClassDef("TopBase", {
				PUBLIC: {
					dummyvar: 0,
					start: function(x){this.perform(x)},
					perform: function(x){this.work(x)},
					work: function(x){this.action1(x)},
				},
				PRIVATE: {
					action1__virtual: function(x){cout("TopBase action1",x)},
				}
			});
			let Wrapper = env.CreateClassWrapper("TopBase", {
				Functions: {"perform": "runTasks"}
			})
			let Derived = env.CreateClassDef("Derived", {
				EXTENDS: [Wrapper],
				PRIVATE: {
					action1__virtual: function(x){cout("Derived action1",x)},
				}
			});
			let d = Derived.New();
			d.runTasks(100);
			d.start(200);
		},
		"class-wrapper-on-virtual": function(env, cout, info){
			info.desc = "tests the wrapper mechanism on private virtual functions with a simple one level single inheritance",
			info.exp = ["Derived action1 100", "Derived action1 200"],
			info.aspects = "class, inheritance, wrapper";
			env.RegisterClassDef("TopBase", {
				PUBLIC: {
					dummyvar: 0,
					start: function(x){this.perform(x)},
					perform: function(x){this.work(x)},
					work: function(x){this.action1(x)},
				},
				PRIVATE: {
					action1__virtual: function(x){cout("TopBase action1",x)},
				}
			});
			let Wrapper = env.CreateClassWrapper("TopBase", {
				Functions: {"action1": "worker"}
			})
			let Derived = env.CreateClassDef("Derived", {
				EXTENDS: [Wrapper],
				PRIVATE: {
					worker__virtual: function(x){cout("Derived action1",x)},
				}
			});
			let d = Derived.New();
			d.perform(100);
			d.start(200);
		},
		"class-wrapper-private-function": function(env, cout, info){
			info.desc = "tests the wrapper mechanism retains access restriction on non member calls";
			if(env.IsDevMode())
				info.exp = ["working", "JEEP: Attempt to invoke private function 'TopBase.run' detected."];
			else
				info.exp = ["working", "working"];
			info.aspects = "class, inheritance, wrapper, access";
			env.RegisterClassDef("TopBase", {
				PUBLIC: {
					dummyvar: 0,
					start: function(x){this.perform(x)},
					perform: function(x){this.work(x)},
				},
				PRIVATE: {
					work: function(x){cout("working")},
				}
			});
			let Wrapper = env.CreateClassWrapper("TopBase", {
				Functions: {"work": "run"}
			})
			let Derived = env.CreateClassDef("Derived", {
				EXTENDS: [Wrapper],
				PUBLIC: {
					act: function(){this.run()}
				}
			});
			let d = Derived.New();
			d.start();
			try{d.run()}catch(e){cout(e)}
		},
		"class-wrapper-private-nonvirtual": function(env, cout, info){
			info.desc = "tests the wrapper mechanism retains access restriction on derived class";
			if(env.IsDevMode())
				info.exp = ["working", "JEEP: Attempt to invoke base class private function 'TopBase.run' from derived class function detected. Call trace: [Derived.act]."];
			else
				info.exp = ["working", "working"];
			info.aspects = "class, inheritance, wrapper, access";
			env.RegisterClassDef("TopBase", {
				PUBLIC: {
					dummyvar: 0,
					start: function(x){this.perform(x)},
					perform: function(x){this.work(x)},
				},
				PRIVATE: {
					work: function(x){cout("working")},
				}
			});
			let Wrapper = env.CreateClassWrapper("TopBase", {
				Functions: {"work": "run"}
			})
			let Derived = env.CreateClassDef("Derived", {
				EXTENDS: [Wrapper],
				PUBLIC: {
					act: function(){this.run()}
				}
			});
			let d = Derived.New();
			d.start(200);
			try{d.act()}catch(e){cout(e)}
		},
		"class-wrapper-on-constant-function": function(env, cout, info){
			info.desc = "tests the wrapper mechanism on constant functions with a simple one level single inheritance";
			if(env.IsDevMode())
				info.exp = ["JEEP: Attempt to change the variable 'TopBase.number' inside constant function detected. Call trace: [Derived.act].","ok"];
			else
				info.exp = ["ok"]
			info.aspects = "class, inheritance, wrapper";
			env.RegisterClassDef("TopBase", {
				PUBLIC: {
					value: 100,
					work__const: function(x){this.value = x},
				},
			});
			let Wrapper = env.CreateClassWrapper("TopBase", {
				Functions: {"work": "act"},
				Variables: {"value": "number"}
			})
			let Derived = env.CreateClassDef("Derived", {
				EXTENDS: [Wrapper],
			});
			let d = Derived.New();
			try{d.act(200)}catch(e){cout(e)}
			cout("ok")
		},
		"class-wrapper-on-const-var": function(env, cout, info){
			info.desc = "tests that wrapping mechanism on constant variable"
			if(env.IsDevMode())
				info.exp = [
				"JEEP: Attempt to change constant variables 'Derived.obj' detected. Call trace: [Derived.funcA].",
				"JEEP: Attempt to change constant variable 'Test.number' by non member function detected.",
				"ok"
				];
			else
				info.exp = ["ok"]
			info.aspects = "class, function directive";
			env.RegisterClassDef("Test", {
				PUBLIC: {
					value__const: 10,
					obj__const: {a: 10},
					funcA: function(f){f(this)}
				}
			});
			let Wrapper = env.CreateClassWrapper("Test", {
				Variables: {"value": "number"}
			})
			let Derived = env.CreateClassDef("Derived", {
				EXTENDS: [Wrapper],
			});
			let c = Derived.New();
			try{c.funcA(function(x){x.obj.a=0})}catch(e){cout(e)}
			try{c.number = 0}catch(e){cout(e)}
			cout("ok")
		},
		"class-static-basic": function(env, cout, info){
			info.desc = "tests static member setup, including sharing across instances";
			if(env.IsDevMode())
				info.exp = [
				"public static value: 10",
				"JEEP: Attempt to read private static variable 'Class.privvalue' detected.",
				"private static value: 20",
				"private static value: 20",
				"private static value: -1",
				"public static value: -1",
				];
			else
				info.exp = [
				"public static value: 10",
				"private static value: 20",
				"private static value: 20",				
				"private static value: 20",
				"private static value: -1",
				"public static value: -1",
				];				
			info.aspects = "static";
			let Class = env.CreateClassDef("Class", {
				PUBLIC: {
					dummyvar: 0,
					work: function(){
						cout("private static value:", this.$static.privvalue)
					},
					change: function(x){this.$static.privvalue = x},
				},
				STATIC: {
					pubvalue: 10,					
					privvalue__private: 20,	
					work: function(){cout("private static value:", this.privvalue)}				
				}
			})
			cout("public static value:",Class.STATIC.pubvalue);
			try{cout("private static value:", Class.STATIC.privvalue)}catch(e){cout(e)}
			Class.STATIC.work();
			Class.STATIC.pubvalue = -1;
			let c = Class.New();
			c.work();
			c.change(-1);
			let d = Class.New();
			d.work();
			cout("public static value:",Class.STATIC.pubvalue);
		},		
		"class-static-ctor-dtor": function(env, cout, info){
			info.desc = "tests managed lifetime (with nested calls)"
			info.exp = [
			"constructing",
			"destructing"
				];
			info.aspects = "class, static, constructor, destructor";
			let Resource = env.CreateClassDef("Resource", {
				CONSTRUCTOR__managed: function(x){
					this.$static.print("constructing");
				},
				DESTRUCTOR: function(){
					this.$static.print("destructing");
				},
				PUBLIC: {
					value: 10,
					work: function(){
					}
				},
				STATIC:{
					print__private: function(w){cout(w)}
				}
			});
			let Class = env.CreateClassDef("Class", {
				PUBLIC: {
					dummyvar: 0,
					test__managed: function(){
						Resource.New(200);
					}
				}
			});
			let c = Class.New();
			c.test();
		},
		"class-static-wrapper": function(env, cout, info){
			info.desc = "tests the wraper mechanism with a simple one level single inheritance (with variable read/write, constructor and congifurability)",
			info.exp = [
			"constructing",
			"working",
			"destructing"
				];
			info.aspects = "class, static, constructor, destructor";
			env.RegisterClassDef("Resource", {
				CONSTRUCTOR__managed: function(x){
					this.$static.print("constructing");
				},
				DESTRUCTOR: function(){
					this.$static.print("destructing");
				},
				PUBLIC: {
					value: 10,
					work: function(){
						this.$static.print("working");						
					}
				},
				STATIC:{
					print__private: function(w){cout(w)}
				}
			});
			let Wrapper = env.CreateClassWrapper("Resource", {
				Functions: {
					"work": "runTasks"
				},
				Variables: {
					"value": "number"
				}
			})
			let Derived = env.CreateClassDef("Derived", {
				EXTENDS: [Wrapper],
			});
			let Class = env.CreateClassDef("Class", {
				PUBLIC: {
					dummyvar: 0,
					test__managed: function(){
						Derived.New(200).runTasks();
					}
				}
			});
			let c = Class.New();
			c.test();
		},
		"class-static-inheritance": function(env, cout, info){
			info.desc = "tests static member inheritance"
			if(env.IsDevMode())
				info.exp = [
				"base",
				"Class.public static value: 10",
				"Class.private static value: 1023",
				"base2",
				"Class.public static value: -100",
				"Class.private static value: 1023",
				"derived",
				"Class.public static value: -100",
				"Class.private static value: 1023",
				"Derived.private static value: 301",
				"JEEP: Attempt to read private static variable 'Class.privvalue' detected.",
				"JEEP: Attempt to read private static variable 'Derived.privvalue' detected.",
				];
			else
				info.exp = [
				"base",
				"Class.public static value: 10",
				"Class.private static value: 1023",
				"base2",
				"Class.public static value: -100",
				"Class.private static value: 1023",
				"derived",
				"Class.public static value: -100",
				"Class.private static value: 1023",
				"Derived.private static value: 301",
				];

			info.aspects = "static";
			let Class = env.CreateClassDef("Class", {
			CONSTRUCTOR: function(n){this.name = n},
				PUBLIC: {
					name: "",
					work: function(){
						cout(this.name);
						this.$static.privwork();
					},
					change: function(x){this.$static.privvalue = x},
				},
				STATIC: {
					pubvalue: 10,		
					privvalue__private: 30,	
					privwork__private: function(){
						cout(this.$name+".public static value:", this.pubvalue)
						cout(this.$name+".private static value:", this.privvalue)
					},			
				}
			})
			let Derived = env.CreateClassDef("Derived", {
				EXTENDS: [Class],
				PUBLIC: {
					dwork: function(){
						this.work();
						this.$static.privwork();
					}
				},
				STATIC: {
					pubvalue: 101,		
					privvalue__private: 301,	
					privwork__private: function(){cout(this.$name+".private static value:", this.privvalue)},			
				}
			})
			let c = Class.New("base");
			c.change(1023)
			c.work();
			Class.STATIC.pubvalue = -100;
			Class.New("base2").work();
			let d = Derived.New("derived");
			d.dwork();
			try{let y = Class.STATIC.privvalue}catch(e){cout(e)}
			try{let y = Derived.STATIC.privvalue}catch(e){cout(e)}
		},		
		/***************************
		***** field
		****************************/
		"field-basic": function(env, cout, info){
			info.desc = "tests basic setup of fields"
			info.exp = ["ok", "0"];
			info.aspects = "field";
			let obj = {};
			env.CreateField(obj, "Field", {
				print: function(){
					this.val = 0;
					cout("ok")
				}
			});
			obj.print();
			cout(obj.val)
		},
		"field-register": function(env, cout, info){
			info.desc = "tests registering fields"
			info.exp = ["ok", "0"];
			info.aspects = "field";
			env.RegisterField("Test", {
				print: function(){
					this.val = 0;
					cout("ok")
				}
			});
			let obj = JEEP.GetObjectDef("Test");
			obj.print();
			cout(obj.val)
		},
		"field-directives": function(env, cout, info){
			info.desc = "tests field with validated functions (argnum,argconst,argtype,managed)"
			info.exp = ["ok","ok","ok",
			"Resource 10 CONSTRUCTOR", "Resource -1 CONSTRUCTOR", "Resource -2 CONSTRUCTOR", "Resource -3 CONSTRUCTOR", 
			"Resource -3 DESTRUCTOR", "Resource -2 DESTRUCTOR", "Resource -1 DESTRUCTOR", "Resource 10 DESTRUCTOR"
			];
			info.aspects = "field";
			let obj = {};
			let Resource = env.CreateClassDef("Resource", {
				CONSTRUCTOR__managed: function(x){
					this.value = x;
					cout(this.$name + " " + this.value + " CONSTRUCTOR")
				},
				DESTRUCTOR: function(){
					cout(this.$name + " " + this.value + " DESTRUCTOR")
				},
				PUBLIC: {
					value: 0,
					work__managed: function(){
						this.$def.New(-1);
						this.$def.New(-2);
						this.$def.New(-3);
					}
				}
			});
			env.CreateField(obj, "Field", {
				print1__argnum: function(){cout("ok")},
				print2__argconst: function(a){cout("ok")},
				print3__argtype: function(a__number){return function(a){cout("ok")}},
				print4__managed: function(){Resource.New(10).work()},
			});
			obj.print1();
			obj.print2();
			obj.print3(1);
			obj.print4();
		},
		/***************************
		***** group
		****************************/
		"group-basic": function(env, cout, info){
			info.desc = "tests basic setup of groups"
			info.exp = ["initializing...", "ok", "100"];
			info.aspects = "group";
			let obj = {};
			env.CreateGroup(obj, "group", {
				CONSTRUCTOR: function(x){
					cout("initializing...")
					this.val = x
				},
				PUBLIC: {
					val: 0,
					print: function(){
						cout("ok")
					}
				}
			});
			obj.Init(100);
			obj.Init(-1);			
			obj.print();
			cout(obj.val)
		},
		"group-noinit": function(env, cout, info){
			info.desc = "tests basic setup of groups"
			info.exp = ["no init"];
			info.aspects = "group";
			let obj = {};
			env.CreateGroup(obj, "group", {
				PUBLIC: {
					val: 0,
					print: function(){
						cout("ok")
					}
				}
			});
			cout(obj["Init"] === undefined ? "no init" : "init")
		},
		"group-register": function(env, cout, info){
			info.desc = "tests basic setup of groups"
			info.exp = ["initializing...", "ok", "100"];
			info.aspects = "group";
			env.RegisterGroup("group", {
				CONSTRUCTOR: function(x){
					cout("initializing...")
					this.val = x
				},
				PUBLIC: {
					val: 0,
					print: function(){
						cout("ok")
					}
				}
			});
			let obj = JEEP.GetObjectDef("group")
			obj.Init(100);
			obj.Init(-1);
			obj.print();
			cout(obj.val)
		},
		"group-access": function(env, cout, info){
			info.desc = "tests basic setup of groups"
			info.exp = ["-1"];
			info.aspects = "group";
			env.RegisterGroup("group", {
				PUBLIC: {
					val: 100,
					print: function(){
						this.privprint();
					}
				},
				PRIVATE: {
					privval: -1,
					privprint: function(){cout(this.privval)}
				}
			});
			let obj = JEEP.GetObjectDef("group")
			obj.print();
		},
		/***************************
		***** namespace
		****************************/
		"namespace-basic": function(env, cout, info){
			info.desc = "tests the namsepace structure"
			info.exp = ["namespace record present", "global record absent"];
			info.aspects = "namespace";
			let ns = env.CreateNamespace();
			ns.RegisterRecordDef("Rec", {val: 10});
			let R = ns.GetObjectDef("Rec");
			let Q = null;
			try{Q = JEEP.GetObjectDef("Rec");}catch(e){}// do nothing
			cout(!R?"namespace record absent":"namespace record present")
			cout(!Q?"global record absent":"global record present")
		},		
		"namespace-names": function(env, cout, info){
			info.desc = "tests the namsepace structure"
			info.exp = ["Rec Struct Class"];
			info.aspects = "namespace";
			let ns = env.CreateNamespace();
			ns.RegisterRecordDef("Rec", {val: 10});
			ns.RegisterClassDef("Class", {PUBLIC:{val: 10, f: function(){}}})
			ns.RegisterStructDef("Struct", {val: 10, f: function(){}})
			let R = ns.GetObjectDef("Rec");
			let r = R.New();
			let S = ns.GetObjectDef("Struct")
			let s = S.New();
			let C = ns.GetObjectDef("Class")
			let c = C.New();
			cout(r.$name, s.$name, c.$name)
		},		
		"namespace-partition": function(env, cout, info){
			info.desc = "tests the namsepace partition mechanism"
			info.exp = ["RecF not in main namespace","RecS not in main namespace",
			"RecS not in first partitioned namespace","RecF not in second partitioned namespace"];
			info.aspects = "namespace";
			let ns = env.CreateNamespace();
			ns.Partition("first, second")
			ns.$.first.RegisterRecordDef("RecF", {val: 10});
			ns.$.second.RegisterRecordDef("RecS", {val: 10});
			try{ns.GetObjectDef("RecF");}catch(e){cout("RecF not in main namespace")}
			try{ns.GetObjectDef("RecS");}catch(e){cout("RecS not in main namespace")}
			try{ns.$.first.GetObjectDef("RecF");}catch(e){cout("RecF not in first partitioned namespace")}
			try{ns.$.first.GetObjectDef("RecS");}catch(e){cout("RecS not in first partitioned namespace")}
			try{ns.$.second.GetObjectDef("RecF");}catch(e){cout("RecF not in second partitioned namespace")}
			try{ns.$.second.GetObjectDef("RecS");}catch(e){cout("RecS not in second partitioned namespace")}
		},		
		"namespace-partition-multiple": function(env, cout, info){
			info.desc = "tests the namsepace multiple partitioning (also flattening mechanism on linear layout)"
			info.exp = ["first", "third", "second"];
			info.aspects = "namespace";
			let ns = env.CreateNamespace();
			ns.Partition("first, third");
			ns.Partition("second");
			let f = ns.Flatten();
			let iter = JEEP.Utils.ObjectIterator.New(f);
			while(iter.GetNext()){
				let p = iter.GetCurrPair();
				cout(p.key)
			}
		},
		"namespace-flatten": function(env, cout, info){
			info.desc = "tests the namsepace flattening mechanism on tree layout"
			info.exp = ["x", "y", "z", "a", "p", "q", "b"];// depth first
			info.aspects = "namespace";
			let ns = env.CreateNamespace();
			ns.Partition("a, b");
			ns.$.a.Partition("x,y,z");
			ns.$.b.Partition("p,q");
			let f = ns.Flatten();
			let iter = JEEP.Utils.ObjectIterator.New(f);
			while(iter.GetNext()){
				let p = iter.GetCurrPair();
				cout(p.key)
			}
		},
		"namespace-object-names": function(env, cout, info){
			info.desc = "tests the names of objects definitions are changed ut not of instances"
			info.exp = ["R.$name .ns0.Rec", "r.$name Rec"];
			info.aspects = "namespace";
			let ns = env.CreateNamespace();
			ns.RegisterRecordDef("Rec", {val: 10});
			let R = ns.GetObjectDef("Rec");
			let r = R.New();
			cout("R.$name", R.$name)
			cout("r.$name", r.$name)
		},		
		"namespace-typedef": function(env, cout, info){
			info.desc = "tests typedef mechanism with objects created in namespace"
			info.exp = ["same: yes"];
			info.aspects = "namespace, typedef";
			let ns = env.CreateNamespace();
			ns.RegisterRecordDef("Rec", {val: 10});
			let R = ns.GetObjectDef("Rec");
			let r = R.New();
			JEEP.Typedef("Rec", R.$name);
			let R2 = JEEP.GetObjectDef("Rec");
			let r2 = R2.New();
			cout("same:", JEEP.Equal(r,r2)?"yes":"no")
		},		
		/***************************
		***** library
		****************************/
		"library-basic": function(env, cout, info){
			info.desc = "tests library setup"
			info.exp = ["initializing library...","10"];
			info.aspects = "library";
			JEEP.RegisterLibrary("Lib", function(x){				
				cout("initializing library...")
				this.namespace.RegisterRecordDef("Rec", {val: x});
			})
			let Lib = env.GetLibrary("Lib", 10);
			Lib = env.GetLibrary("Lib", 20);
			let R = Lib.GetObjectDef("Rec");
			let r = R.New();
			cout(r.val);
		},		
		"library-building-basic": function(env, cout, info){
			info.desc = "tests library Build mechanism with single builder"
			info.exp = ["initializing library...","100"];
			info.aspects = "library";
			JEEP.RegisterLibrary("Lib", function(x){				
				cout("initializing library...")
				this.Build({
					"a": {builder: "builder", args: [100]}
				})
			})
			JEEP.RegisterLibraryBuilder("builder", "Lib",function (x){
				this.namespace.RegisterRecordDef("Rec", {val: x});				
			})
			let Lib = env.GetLibrary("Lib", 10);
			let R = Lib.$.a.GetObjectDef("Rec");
			let r = R.New();
			cout(r.val);
		},		
		"library-building-complex": function(env, cout, info){
			info.desc = "tests library Build mechanism with nested builder"
			info.exp = ["initializing library...","100","33"];
			info.aspects = "library";
			JEEP.RegisterLibrary("Lib", function(x){				
				cout("initializing library...")
				this.Build({
					"a": {builder: "builder", args: [100]}
				})
			})
			JEEP.RegisterLibraryBuilder("morebuilder","Lib",function (x){
				this.namespace.RegisterRecordDef("Rec", {val: x});				
			})
			JEEP.RegisterLibraryBuilder("builder","Lib", function(x){
				this.namespace.RegisterRecordDef("Rec", {val: x});				
				this.Build({
					"a": {builder: "morebuilder", args: [33]}
				})
			})
			let Lib = env.GetLibrary("Lib", 10);
			let R = Lib.$.a.GetObjectDef("Rec");
			let r = R.New();
			cout(r.val);
			R = Lib.$.a.$.a.GetObjectDef("Rec");
			r = R.New();
			cout(r.val);
		},		
		"library-building-private": function(env, cout, info){
			info.desc = "tests library BuildPrivate mechanism with nested builder"
			info.exp = ["initializing library...","233"];
			info.aspects = "library";
			JEEP.RegisterLibrary("Lib", function(x){				
				cout("initializing library...")
				this.Build({
					"a": {builder: "builder", args: x*100}
				})
			})
			JEEP.RegisterLibraryBuilder("morebuilder","Lib",function (x){
				this.namespace.RegisterRecordDef("Rec", {val: x});				
			})
			JEEP.RegisterLibraryBuilder("builder","Lib", function(x){
				let ns = this.BuildPrivate({
					"a": {builder: "morebuilder", args: 33}
				})
				ns = ns.Flatten();
				let R = ns.a.GetObjectDef("Rec");
				let r = R.New();
				this.namespace.RegisterRecordDef("Rec", {val: x + r.val});				
			})
			let Lib = env.GetLibrary("Lib", 2);
			Lib = Lib.Flatten();// if the mechanism fails, this will raise exception due to duplicate artition
			let R = Lib.a.GetObjectDef("Rec");
			let r = R.New();
			cout(r.val);
		},		
	},
	failTests: {
		/***************************
		***** common
		****************************/
		"syntax-environment": function(_, cout, info){
			info.desc = "tests three things - invalid mode, invalid client, invalid description properties"
			info.aspects = "core";
			info.exp = [
			"JEEP: CreateEnvironment should be given 'mode' and 'client' explicitly.",
			"JEEP: CreateEnvironment was called with invalid mode 'test-mode'.",
			"JEEP: CreateEnvironment was called with invalid client 'test-client'.",
			"JEEP: CreateEnvironment was called with invalid property 'xmode,info'.",
			]
			try{let env = JEEP.CreateEnvironment({mode: "test-mode"})}catch(e){cout(e)}
			try{let env = JEEP.CreateEnvironment({mode: "test-mode", client: "jeep-agnostic"})}catch(e){cout(e)}
			try{let env = JEEP.CreateEnvironment({mode: "production-mode", client: "test-client"})}catch(e){cout(e)}
			try{let env = JEEP.CreateEnvironment({xmode: "test-mode", info: 0, client: "jeep-aware"})}catch(e){cout(e)}
		},		
		"syntax-invalid-name": function(env, cout, info){
			info.desc = "tests the names with invalid characters"
			info.aspects = "core";
			info.exp = ["JEEP: The record name '.Test' is invalid since it contains non alphanumeric characters."];
			try{
			let Record = env.CreateRecordDef(".Test", {
				value: 1,
			});
			}catch(e){cout(e)}
			//if(!env.IsDevMode()) cout("ok")
		},		
		"syntax-register-duplicate": function(env, cout, info){
			info.desc = "registers objects with same name more than once"
			info.aspects = "core";
			info.exp = ["JEEP: The class 'Test' could not be registered since there exists a record by the same name."];
			try{
			env.RegisterRecordDef("Test", {
				value: 1,
			});
			env.RegisterClassDef("Test", {})
			}catch(e){cout(e)}
		},
		"def-unregistered": function(env, cout, info){
			info.desc = "tests GetObjectDef with unregistered name"
			info.exp = ["JEEP: GetObjectDef for 'MyCLass' failed since no object by that name was found."];
			info.aspects = "core";
			try{JEEP.GetObjectDef("MyCLass");}catch(e){cout(e)}
		},
		"typedef-unregistered": function(env, cout, info){
			info.desc = "tests the type mechanism with class (is same for record and struct)"
			info.exp = ["JEEP: The type 'MyCLass' is being defined to unregistered object 'Test'."];
			info.aspects = "core";
			try{JEEP.Typedef("MyCLass", "Test");}catch(e){cout(e)}
		},
		"typedef-duplicate": function(env, cout, info){
			info.desc = "tests the type mechanism with class (is same for record and struct)"
			info.exp = ["JEEP: The type 'MyCLass' is already defined."];
			info.aspects = "core";
			env.RegisterStructDef("Test", {
				value: 1,
				print: function(){cout(this.$name, "value =", this.value)}
			});
			JEEP.Typedef("MyCLass", "Test");
			try{JEEP.Typedef("MyCLass", "Testx");}catch(e){cout(e)}
		},
		/***************************
		***** record
		****************************/
		"record-new": function(env, cout, info){
			info.desc = "tests that a function named CONSTRUCTOR with prefix won't be accidentally considered as one"
			info.exp = ["JEEP: Instantiation of record 'Test' with New with arguments is invalid since there is no constructor. Use InitNew instead or define a constructor."];
			info.aspects = "struct";
			let Rec = env.CreateRecordDef("Test", {
				value: 0,
			});
			try{let s = Rec.New(10);}catch(e){cout(e)}
		},
		"record-initnew-noargs": function(env, cout, info){
			info.desc = "tests the record InitNew mechanism failure"
			if(env.IsDevMode())
				info.exp = ["JEEP: The record 'Test' was instantiated with InitNew but without arguments meant for initialiation."];
			else
				info.exp = ["ok"]
			info.aspects = "record";
			let Record = env.CreateRecordDef("Test", {
				value: 1,
			});
			try{let s = Record.InitNew()}catch(e){cout(e)}
			if(!env.IsDevMode())cout("ok")
		},		
		"record-initnew": function(env, cout, info){
			info.desc = "tests the record InitNew mechanism failure"
			if(env.IsDevMode())
				info.exp = ["JEEP: The InitNew construction for the record 'Test' failed due to unregistered names being mentioned [val]."];
			else
				info.exp = ["ok"]
			info.aspects = "record";
			let Record = env.CreateRecordDef("Test", {
				value: 1,
			});
			try{let s = Record.InitNew({val: 10})}catch(e){cout(e)}
			if(!env.IsDevMode())cout("ok")
		},		
		"syntax-record-badprops": function(env, cout, info){
			info.desc = "creates record with invalid definition properties"
			info.aspects = "record";
			if(env.IsDevMode())
				info.exp = [
				"JEEP: CreateRecordDef was called with invalid property 'PUBLIC,CONSTRUCTOR'.",
				"JEEP: RegisterRecordDef was called with invalid property 'PUBLIC,CONSTRUCTOR'.",
				];
			else
				info.exp = ["ok"]
			try{env.CreateRecordDef("Test", {
				PUBLIC: 0,
				CONSTRUCTOR: 0,
			})}catch(e){cout(e)}
			try{env.RegisterRecordDef("Test", {
				PUBLIC: 0,
				CONSTRUCTOR: 0,
			})}catch(e){cout(e)}
			if(!env.IsDevMode())cout("ok")
		},
		"syntax-record-novars": function(env, cout, info){
			info.desc = "creates record with no variables"
			info.aspects = "record";
			if(env.IsDevMode())
				info.exp = [
				"JEEP: Compilation found 1 error(s) for record 'Res'.",
				"1. The definition is invalid since it contains no variables.",
				"JEEP aborted.",
				];
			else
				info.exp = ["ok"]
			try{
			env.RegisterRecordDef("Res", {
			});}catch(e){cout(e)}
			if(!env.IsDevMode())cout("ok")
		},
		"syntax-record-with-bad-extension": function(env, cout, info){
			info.desc = "creates record with bad extends - non string, non registered name and using records with clashing names";
			info.aspects = "record";
			if(env.IsDevMode())
				info.exp = [
				"JEEP: Compilation found 4 error(s) for record 'Res2'.",
				"1. The base record 'Test' to extend from is not registered.",
				"2. The EXTENDS property should contain strings and record objects only.",
				"3. The variable 'Res.j' causes name clash upon extending the record.",
				"4. The variable 'Second.j' causes name clash upon extending the record.",
				"JEEP aborted.",
				];
			else
				info.exp = ["ok"]
			try{
				let Res = env.CreateRecordDef("Res", {
					j: 0,
				});
				env.RegisterRecordDef("Second", {
					j: 0,
				});
				env.CreateRecordDef("Res2", {
					EXTENDS: [23, "Test", Res, "Second"],
					j: 99,
				})
			}catch(e){cout(e)}
			if(!env.IsDevMode())cout("ok")
		},
		/***************************
		***** struct
		****************************/
		"struct-new-noctor": function(env, cout, info){
			info.desc = "tests that a function named CONSTRUCTOR with prefix won't be accidentally considered as one"
			info.exp = ["JEEP: Instantiation of struct 'Test' with New with arguments is invalid since there is no constructor. Use InitNew instead or define a constructor."];
			info.aspects = "struct";
			let Struct = env.CreateStructDef("Test", {
				value: 0,
				print: function(){cout(this.$name, "value =", this.value)}
			});
			try{let s = Struct.New(10);}catch(e){cout(e)}
		},
		"struct-initnew": function(env, cout, info){
			info.desc = "tests the InitNew mechanism failure"
			if(env.IsDevMode())
				info.exp = ["JEEP: The InitNew construction for the struct 'Test' failed due to unregistered names being mentioned [val]."];
			else
				info.exp = ["ok"]
			info.aspects = "struct";
			let Struct = env.CreateStructDef("Test", {
				value: 1,
				print: function(){cout(this.$name, "value =", this.value)}
			});
			try{let s = Struct.InitNew({val: 10})}catch(e){cout(e)}
			if(!env.IsDevMode())cout("ok")
		},		
		"struct-initnew-moreargs": function(env, cout, info){
			info.desc = "tests the record InitNew mechanism failure"
			if(env.IsDevMode())
				info.exp = ["JEEP: The struct 'Test' was instantiated with InitNew with more than one argument meant for initialiation."];
			else
				info.exp = ["ok"]
			info.aspects = "struct";
			let Record = env.CreateStructDef("Test", {
				f: function(){},
				value: 1,
			});
			try{let s = Record.InitNew(1,2,3)}catch(e){cout(e)}
			if(!env.IsDevMode())cout("ok")
		},		
		"struct-initnew-noargs": function(env, cout, info){
			info.desc = "tests the record InitNew mechanism failure"
			if(env.IsDevMode())
				info.exp = ["JEEP: The struct 'Test' was instantiated with InitNew but without arguments meant for initialiation."];
			else
				info.exp = ["ok"]
			info.aspects = "struct";
			let Record = env.CreateStructDef("Test", {
				f: function(){},
				value: 1,
			});
			try{let s = Record.InitNew()}catch(e){cout(e)}
			if(!env.IsDevMode())cout("ok")
		},		
		"syntax-struct-badprops": function(env, cout, info){
			info.struct = "creates struct with invalid definition properties"
			info.aspects = "struct";
			if(env.IsDevMode())
				info.exp = [
				"JEEP: CreateStructDef was called with invalid property 'PUBLIC,EXTENDS'.",
				"JEEP: RegisterStructDef was called with invalid property 'PUBLIC,EXTENDS'.",
				];
			else
				info.exp = ["ok"]
			try{env.CreateStructDef("Test", {
				PUBLIC: 0,
				EXTENDS: 0,
			})}catch(e){cout(e)}
			try{env.RegisterStructDef("Test", {
				PUBLIC: 0,
				EXTENDS: 0,
			})}catch(e){cout(e)}
			if(!env.IsDevMode())cout("ok")
		},
		"syntax-struct-novars": function(env, cout, info){
			info.desc = "creates record with no variables"
			info.aspects = "struct";
			if(env.IsDevMode())
				info.exp = [
				"JEEP: Compilation found 1 error(s) for struct 'Res'.",
				"1. The definition is invalid since it contains no variables.",
				"JEEP aborted.",
				];
			else
				info.exp = ["ok"]
			try{
			env.RegisterStructDef("Res", {
				f: function(){}
			});}catch(e){cout(e)}
			if(!env.IsDevMode())cout("ok")
		},
		"syntax-struct-with-nofunctions": function(env, cout, info){
			info.desc = "creates struct with functions"
			info.aspects = "struct";
			if(env.IsDevMode())
				info.exp = [
				"JEEP: Compilation found 1 error(s) for struct 'Res'.",
				"1. The definition is invalid since it contains no functions.",
				"JEEP aborted.",
				];
			else
				info.exp = ["ok"]
			try{
			env.RegisterStructDef("Res", {
				j: 0,
			});}catch(e){cout(e)}
			if(!env.IsDevMode())cout("ok")
		},
		"syntax-struct-with-bad-directives": function(env, cout, info){
			info.desc = "creates struct with invalid function and variable directives"
			info.aspects = "struct";
			if(env.IsDevMode())
				info.exp = [
				"JEEP: Compilation found 4 error(s) for struct 'Res'.",
				"1. The variable 'j' uses invalid directive(s) 'public'.",
				"2. The constructor cannot take any directives",
				"3. The function 'f' uses invalid directive(s) 'const'.",
				"4. The function 'k' uses unknown directive(s) 'privte'.",
				"JEEP aborted.",
				];
			else
				info.exp = ["ok"]
			try{
			env.RegisterStructDef("Res", {
				managed_CONSTRUCTOR: 0,
				CONSTRUCTOR__managed: function(){},
				j__public: 0,
				f__const: function(){},
				k__privte: function(){},
			});}catch(e){cout(e)}
			if(!env.IsDevMode())cout("ok")
		},
		"syntax-struct-dupfuncs": function(env, cout, info){
			info.desc = "creates struct with functions of same names but with different directives";
			info.aspects = "struct";
			if(env.IsDevMode())
				info.exp = [
				"JEEP: Compilation found 2 error(s) for struct 'Res'.",
				"1. The variable 'v' is declared multiple times with different directives.",
				"2. The function 'func' is declared multiple times with different directives.",
				"JEEP aborted.",
				];
			else
				info.exp = ["ok"]
			try{
			env.RegisterStructDef("Res", {
				v: 0,
				v__private: -1,
				func: function(){},
				func__private: function(){}
			});}catch(e){cout(e)}
			if(!env.IsDevMode())cout("ok")
		},
		"syntax-struct-pmc-nonstring": function(env, cout, info){
			info.desc = "tests the access restriction of structure"
			if(env.IsDevMode())
				info.exp = [
				"JEEP: Compilation found 1 error(s) for struct 'Test'.",
				"1. PMC should be a comma separated string.",
				"JEEP aborted.",
				]
			else
				info.exp = ["ok"]
			info.aspects = "struct";
			try{
			let Struct = env.CreateStructDef("Test", {
				PMC: ["pmc-memaccess"],
				CONSTRUCTOR: function(x){this.change(x);},
				print: function(){cout(this.$name, "value =", this.value)},
				value__private: 0,
				change__private: function(v){this.value = v},
			});
			}catch(e){cout(e)}
			if(!env.IsDevMode())cout("ok")
		},
		"syntax-struct-pmc-unknown": function(env, cout, info){
			info.desc = "tests the access restriction of structure"
			if(env.IsDevMode())
				info.exp = [
				"JEEP: Compilation found 1 error(s) for struct 'Test'.",
				"1. PMC contains unknown flag(s) 'pmc-allowaccess'.",
				"JEEP aborted.",
				]
			else
				info.exp = ["ok"]
			info.aspects = "struct";
			try{
			let Struct = env.CreateStructDef("Test", {
				PMC: "pmc-allowaccess",
				CONSTRUCTOR: function(x){this.change(x);},
				print: function(){cout(this.$name, "value =", this.value)},
				value__private: 0,
				change__private: function(v){this.value = v},
			});
			}catch(e){cout(e)}
			if(!env.IsDevMode())cout("ok")
		},
		"syntax-struct-pmc-invalid": function(env, cout, info){
			info.desc = "tests the access restriction of structure"
			if(env.IsDevMode())
				info.exp = [
				"JEEP: Compilation found 1 error(s) for struct 'Test'.",
				"1. PMC contains invalid flags.",
				"JEEP aborted.",
				]
			else
				info.exp = ["ok"]
			info.aspects = "struct";
			try{
			let Struct = env.CreateStructDef("Test", {
				PMC: "pmc-argtype",
				CONSTRUCTOR: function(x){this.change(x);},
				print: function(){cout(this.$name, "value =", this.value)},
				value__private: 0,
				change__private: function(v){this.value = v},
			});
			}catch(e){cout(e)}
			if(!env.IsDevMode())cout("ok")
		},
		/***************************
		***** class
		****************************/
		"class-new-noctor": function(env, cout, info){
			info.desc = "calls New with arguments but defines no constructor"
			info.exp = ["JEEP: Instantiation of class 'Test' with New with arguments is invalid since there is no constructor. Use InitNew instead or define a constructor."];
			info.aspects = "class";
			let Rec = env.CreateClassDef("Test", {
				PUBLIC: {value: 0, f: function(){}}
			});
			try{let s = Rec.New(10);}catch(e){cout(e)}
		},
		"class-access-fail": function(env, cout, info){
			info.desc = "tests class access restriction";
			if(env.IsDevMode())
				info.exp = [
					"JEEP: Attempt to invoke protected function 'Test.protprint' detected.",
					"pubval: 1", "privval: 3", 
					"protval: 2", "privval: 3", "privval: 4",
					"JEEP: Attempt to read private variable 'Test.privval' detected.",
					"JEEP: Attempt to write private variable 'Test.privval' detected.",
					];
			else
				info.exp = [
					"protval: 2", "privval: 3",
					"pubval: 1", "privval: 3", 
					"protval: 2", "privval: 3", 
					"privval: 4",
					"privval: 5",
					];

			info.aspects = "class, access";
			let Class = env.CreateClassDef("Test", {
				PUBLIC: {
					pubval: 1,
					pubprint: function(f){
						cout("pubval:",this.pubval);
						this.pubprint2();
						this.protprint();
						f(this);
						try{this.ExternalCall(f, this);}catch(e){cout(e)}
					},
					pubprint2: function(){
						this.privprint();
					}
				},
				PROTECTED: {
					protval: 2,
					protprint: function(){
						cout("protval:",this.protval);
						this.privprint();
					},
				},
				PRIVATE: {
					privval: 3,
					privprint: function(){
						cout("privval:",this.privval)
					}
				}
			});
			let c = Class.New();
			try{c.protprint();}catch(e){cout(e)}
			c.pubprint(function(c){
				c.privval++; 
				c.privprint()
			});
			try{c.privval = 10;}catch(e){cout(e)}
		},
		"class-access-fail-multiple-instance": function(env, cout, info){
			info.desc = "tests class access restriction with multiple instances";
			if(env.IsDevMode())
				info.exp = ["pubval: 1", "privval: 3","JEEP: Attempt to invoke private function 'Test.privprint' detected.",];
			else
				info.exp = ["pubval: 1", "privval: 3","privval: 3"];
			info.aspects = "class, access";
			let Class = env.CreateClassDef("Test", {
				PUBLIC: {
					pubval: 1,
					pubprint: function(f, g){
						cout("pubval:",this.pubval);
						f(this);// this is friend of this instance, so won't raise exception
						this.ExternalCall(g);// this will, as it works with another instance, see below
					},
				},
				PRIVATE: {
					privval: 3,
					privprint: function(){
						cout("privval:",this.privval)
					}
				}
			});
			let c = Class.New();
			c.pubprint(function(x){
				try{x.privprint()}catch(e){cout(e)}
			},function(){
				let d = Class.New();
				try{d.privprint()}catch(e){cout(e)}
			});
		},
		"class-const-func-fail": function(env, cout, info){
			info.desc = "tests that constant function directive works"
			if(env.IsDevMode())
				info.exp = [
				"JEEP: Attempt to change the variable 'Test.value' inside constant function detected. Call trace: [Test.print,Test.work].",
				"ok"
				];
			else
				info.exp = ["ok"]
			info.aspects = "class, function directive";
			let Class = env.CreateClassDef("Test", {
				PUBLIC: {
					value: 10,
					print__const: function(){this.work()},
					work: function(){this.value = 100},
				}
			});
			let c = Class.New();
			try{c.print();}catch(e){cout(e)}
			cout("ok")
		},
		"class-const-var-fail": function(env, cout, info){
			info.desc = "tests that constant variable directive works (pod and object)"
			if(env.IsDevMode())
				info.exp = [
				"JEEP: Attempt to change constant variables 'Test.obj' detected. Call trace: [Test.funcA].",
				"JEEP: Attempt to change constant variable 'Test.value' by non member function detected.",
				"ok",
				];
			else
				info.exp = ["ok"]
			info.aspects = "class, function directive";
			let Class = env.CreateClassDef("Test", {
				PUBLIC: {
					value__const: 10,
					obj__const: {a: 10},
					funcA: function(f){f(this)}
				}
			});
			let c = Class.New();
			try{c.funcA(function(x){x.obj.a=0})}catch(e){cout(e)}
			try{c.value = 0}catch(e){cout(e)}
			cout("ok")
		},
		"class-argnum-fail": function(env, cout, info){
			info.desc = "tests the argnum directive, validating arguments count"
			if(env.IsDevMode())
				info.exp = [
				"JEEP: The function 'Test.func' was invoked with wrong argument count (declared: 2, given: 1).",
				"JEEP: The function 'Test.func' was invoked with wrong argument count (declared: 2, given: 3).",
				];
			else
				info.exp = ["ok"]
			info.aspects = "class, function directive";
			let Class = env.CreateClassDef("Test", {
				PUBLIC: {
					dummyvar: 0,
					func__argnum: function(f, g){}
				}
			});
			let c = Class.New();
			try{c.func(0)}catch(e){cout(e)}
			try{c.func(0,0,0)}catch(e){cout(e)}
			if(!env.IsDevMode())cout("ok")
		},
		"class-argnumvar-fail": function(env, cout, info){
			info.desc = "tests the argnumvar directive, validating arguments count"
			if(env.IsDevMode())
				info.exp = [
				"JEEP: The function 'Test.func' was invoked with wrong argument count (declared: 2, given: 1).",
				];
			else
				info.exp = ["ok"]
			info.aspects = "class, function directive";
			let Class = env.CreateClassDef("Test", {
				PUBLIC: {
					dummyvar: 0,
					func__argnumvar: function(f, g){}
				}
			});
			let c = Class.New();
			try{c.func(0)}catch(e){cout(e)}
			if(!env.IsDevMode())cout("ok")
		},
		"class-argconst-fail": function(env, cout, info){
			info.desc = "tests the argconst directive, validating arguments are not changed"
			if(env.IsDevMode())
				info.exp = [
				"JEEP: The function 'Test.func' modified its arguments (arg.0,arg.1) despite declaring them constant.",
				"ok",
				];
			else
				info.exp = ["ok"]
			info.aspects = "class, function directive";
			let Class = env.CreateClassDef("Test", {
				PUBLIC: {
					dummyvar: 0,
					func__argconst: function(f, g){f.val = 10, g.x = 0}
				}
			});
			let c = Class.New();
			try{c.func({val: 1}, {})}catch(e){cout(e)}
			cout("ok")
		},
		"class-argtype-fail": function(env, cout, info){
			info.desc = "tests the argtype directive, validating arguments type"
			if(env.IsDevMode())
				info.exp = ["JEEP: The function 'Test.func' was invoked with wrong argument types 'n(number,*string),s(string,*array),a(array,*object),ob(object,*number)'."];
			else
				info.exp = ["ok"]
			info.aspects = "class, function directive";
			let Class = env.CreateClassDef("Test", {
				PUBLIC: {
					dummyvar: 0,
					func__argtype: function(n__number, s__string, a__array, ob__object){
						return function(n,s,a,ob){
						}
					}
				}
			});
			let c = Class.New();
			try{c.func("1",[1,2],{c:1},1);}catch(e){cout(e)}
			if(!env.IsDevMode())cout("ok")
		},
		"class-argtype-fail-count": function(env, cout, info){
			info.desc = "invokes argtype function with wrong argument count"
			if(env.IsDevMode())
				info.exp = ["JEEP: The function 'Test.func' was invoked with wrong argument count (declared: 4, given: 2).", "ok"];
			else
				info.exp = ["ok"]
			info.aspects = "class, function directive";
			let Class = env.CreateClassDef("Test", {
				PUBLIC: {
					dummyvar: 0,
					func__argtype: function(n__number, s__string, a__array, ob__object){
						return function(n,s,a,ob){
						}
					}
				}
			});
			let c = Class.New();
			try{c.func(1,"1");}catch(e){cout(e)}
			cout("ok")
		},
		"class-argtype-fail-type": function(env, cout, info){
			info.desc = "invokes argtype function with non typedef'd argument"
			if(env.IsDevMode())
				info.exp = [
			"JEEP: The function 'Test.func' was invoked with wrong argument types 'n(Rec,*number)'.",
			"JEEP: The function 'Test.func' was invoked with wrong argument types 'n(Rec,*Rec2)'."
			]
			else 
				info.exp = ["ok"]
			info.aspects = "class, function directive";
			env.RegisterRecordDef("Rec", {val: 0})
			env.RegisterRecordDef("Rec2", {val: 0})
			let Class = env.CreateClassDef("Test", {
				PUBLIC: {
					dummyvar: 0,
					func__argtype: function(n__Rec){
						return function(n){
						}
					}
				}
			});
			let c = Class.New();
			try{c.func(1);}catch(e){cout(e)}
			try{c.func(JEEP.GetObjectDef("Rec2").New());}catch(e){cout(e)}
			if(!env.IsDevMode())cout("ok")
		},
		"class-argtype-unreg-type": function(env, cout, info){
			info.desc = "invokes argtype function with non typedef'd argument"
			if(env.IsDevMode())
				info.exp = ["JEEP: The argument type 'any' for the function 'Test.func' is unregistered."]
			else 
				info.exp = ["ok"]
			info.aspects = "class, function directive";
			let Class = env.CreateClassDef("Test", {
				PUBLIC: {
					dummyvar: 0,
					func__argtype: function(n__any){
						return function(n){
						}
					}
				}
			});
			let c = Class.New();
			try{c.func(10);}catch(e){cout(e)}
			if(!env.IsDevMode())cout("ok")
		},	
		"class-managed-bad-location": function(env, cout, info){
			info.desc = "managed class created in a non managed scope"
			info.exp = ["JEEP: The class 'Resource' is declared as managed and hence should be instantiated only within a call chain initiated by a managed function."];
			info.aspects = "class, managed";
			let Resource = env.CreateClassDef("Resource", {
				CONSTRUCTOR__managed: function(x){
					this.value = x;
					cout(this.$name + " " + this.value + " CONSTRUCTOR")
				},
				DESTRUCTOR: function(){
					cout(this.$name + " " + this.value + " DESTRUCTOR")
				},
				PUBLIC: {
					value: 10,
					work__managed: function(){
						this.$def.New(-1);
					}
				}
			});
			try{Resource.New()}catch(e){cout(e)}
		},
		"class-single-inheritance-access-fail": function(env, cout, info){
			info.desc = "tests the single inheritance setup with private member accessed from derived class"
			if(env.IsDevMode())
				info.exp = [
				"JEEP: Attempt to read base class private variable 'TopBase.value' from derived class function detected. Call trace: [Derived.dprint].",
				"JEEP: Attempt to write base class private variable 'TopBase.value' from derived class function detected. Call trace: [Derived.dprint].",
				"JEEP: Attempt to invoke base class private function 'TopBase.print' from derived class function detected. Call trace: [Derived.dprint].",
				"JEEP: Attempt to read base class private variable 'MidBase.mvalue' from derived class function detected. Call trace: [Derived.dprint].",
				"JEEP: Attempt to write base class private variable 'MidBase.mvalue' from derived class function detected. Call trace: [Derived.dprint].",
				"JEEP: Attempt to invoke base class private function 'MidBase.mprint' from derived class function detected. Call trace: [Derived.dprint].",
				];
			else
				info.exp = ["TopBase value: 0", "TopBase value: 0", "MidBase value: 0"]
			info.aspects = "class, inheritance";
			let TopBase = env.CreateClassDef("TopBase", {
				PRIVATE: {
					value: 10,
					print: function(){cout("TopBase value:", this.value)}
				}
			});
			let MidBase = env.CreateClassDef("MidBase", {
				EXTENDS: [TopBase],
				PRIVATE: {
					mvalue: 10,
					mprint: function(){
						this.print();
						cout("MidBase value:", this.mvalue)
					}
				}
			});
			let Derived = env.CreateClassDef("Derived", {
				EXTENDS: [MidBase],
				PUBLIC: {
					dvalue: 10,
					dprint: function(){
						try{this.value;}catch(e){cout(e)}
						try{this.value = 0;}catch(e){cout(e)}
						try{this.print();}catch(e){cout(e)}
						try{this.mvalue;}catch(e){cout(e)}
						try{this.mvalue = 0;}catch(e){cout(e)}
						try{this.mprint();}catch(e){cout(e)}
					}
				}
			});
			let d = Derived.New();
			d.dprint();
		},
		"class-abstract-instantiation": function(env, cout, info){
			info.desc = "tests that classes with unimplemented abstract functions are not instantiated"
			info.exp = [
			"JEEP: The class 'TopBase' cannot be instantiated due to presence of unimplemented abstract functions 'TopBase.action1'.",
			"JEEP: The class 'Derived' cannot be instantiated due to presence of unimplemented abstract functions 'Derived.action3,TopBase.action1,MidBase.action2'."
			];
			info.aspects = "class, inheritance, abstract";
			let TopBase = env.CreateClassDef("TopBase", {
				PRIVATE: {
					dummyvar: 0,
					action1__abstract: function(){}
				}
			});
			let MidBase = env.CreateClassDef("MidBase", {
				EXTENDS: [TopBase],
				PRIVATE: {
					action2__abstract: function(){}
				}
			});
			let Derived = env.CreateClassDef("Derived", {
				EXTENDS: [MidBase],
				PRIVATE: {
					action3__abstract: function(){}
				}
			});
			try{TopBase.New();}catch(e){cout(e)}
			try{Derived.New();}catch(e){cout(e)}
		},
		"class-reabstract-instantiation": function(env, cout, info){
			info.desc = "tests that classes with unimplemented abstract functions are not instantiated"
			info.exp = ["JEEP: The class 'Derived' cannot be instantiated due to presence of unimplemented abstract functions 'MidBase.action'."];
			info.aspects = "class, inheritance, abstract";
			let TopBase = env.CreateClassDef("TopBase", {
				PRIVATE: {
					dummyvar: 0,
					action__virtual: function(){}
				}
			});
			let MidBase = env.CreateClassDef("MidBase", {
				EXTENDS: [TopBase],
				PRIVATE: {
					action__abstract: function(){}
				}
			});
			let Derived = env.CreateClassDef("Derived", {
				EXTENDS: [MidBase],
				PRIVATE: {
				}
			});
			try{Derived.New();}catch(e){cout(e)}
		},
		"class-initnew": function(env, cout, info){
			info.desc = "tests class initnew"
			if(env.IsDevMode())
				info.exp = ["JEEP: The InitNew construction for the class 'Test' failed due to unregistered names being mentioned [years,town]."];
			else
				info.exp = ["info: <noname> 0 <nocity>"]
			info.aspects = "class";
			env.RegisterClassDef("Test", {
				CONSTRUCTOR: function(x){
					this.print();
				},
				PUBLIC: {
					name: "<noname>",
					age: 0,
					city: "<nocity>",
					print: function(){cout("info:", this.name, this.age, this.city)}
				}
			});
			let Class = JEEP.GetObjectDef("Test");
			try{Class.InitNew({years: 10, town: "neverland"})}catch(e){cout(e)}
		},
		"class-ctor-false": function(env, cout, info){
			info.desc = "the name says it all"
			info.exp = [
			"Base CONSTRUCTOR",
			"Middle CONSTRUCTOR",
			"Middle DESTRUCTOR",
			"Base DESTRUCTOR",
			"JEEP: The class 'Derived' could not be instantiated. Reason: false."
			];
			info.aspects = "field";
			let Base = env.CreateClassDef("Base", {
				CONSTRUCTOR__managed: function(x){
					cout("Base CONSTRUCTOR")
				},
				DESTRUCTOR: function(){
					cout("Base DESTRUCTOR")
				},
				PUBLIC: {
					value: 10,
					f: function(){}
				}
			});
			let Middle = env.CreateClassDef("Middle", {
				EXTENDS: [Base],
				CONSTRUCTOR__managed: function(x){
					cout("Middle CONSTRUCTOR")
				},
				DESTRUCTOR: function(){
					cout("Middle DESTRUCTOR")
				},
			});
			let Low = env.CreateClassDef("Low", {
				EXTENDS: [Middle],
				CONSTRUCTOR__managed: function(x){
					return false;
				},
				DESTRUCTOR: function(){
					cout("Low DESTRUCTOR")
				},
			});
			let Derived = env.CreateClassDef("Derived", {
				EXTENDS: [Low],
				CONSTRUCTOR__managed: function(x){
					cout("Derived CONSTRUCTOR")
				},
				DESTRUCTOR: function(){
					cout("Derived DESTRUCTOR")
				},
			});
			let obj = {};
			env.CreateField(obj, "Field", {
				test__managed: function(){Derived.New()},
			});
			try{obj.test()}catch(e){cout(e)}
		},
		"class-partial-destruction-single-inheritance": function(env, cout, info){
			info.desc = "the name says it all"
			info.exp = [
			"Base CONSTRUCTOR",
			"Middle CONSTRUCTOR",
			"Middle DESTRUCTOR",
			"Base DESTRUCTOR",
			"JEEP: The class 'Derived' could not be instantiated as the constructor raised the exception 'you all suck'."
			];
			info.aspects = "field";
			let Base = env.CreateClassDef("Base", {
				CONSTRUCTOR__managed: function(x){
					cout("Base CONSTRUCTOR")
				},
				DESTRUCTOR: function(){
					cout("Base DESTRUCTOR")
				},
				PUBLIC: {
					value: 10,
					f: function(){}
				}
			});
			let Middle = env.CreateClassDef("Middle", {
				EXTENDS: [Base],
				CONSTRUCTOR__managed: function(x){
					cout("Middle CONSTRUCTOR")
				},
				DESTRUCTOR: function(){
					cout("Middle DESTRUCTOR")
				},
			});
			let Low = env.CreateClassDef("Low", {
				EXTENDS: [Middle],
				CONSTRUCTOR__managed: function(x){
					throw "you all suck"
					cout("Low DESTRUCTOR")
				},
				DESTRUCTOR: function(){
					cout("Low DESTRUCTOR")
				},
			});
			let Derived = env.CreateClassDef("Derived", {
				EXTENDS: [Low],
				CONSTRUCTOR__managed: function(x){
					cout("Derived CONSTRUCTOR")
				},
				DESTRUCTOR: function(){
					cout("Derived DESTRUCTOR")
				},
			});
			let obj = {};
			env.CreateField(obj, "Field", {
				test__managed: function(){Derived.New()},
			});
			try{obj.test()}catch(e){cout(e)}
		},
		"class-partial-destruction-single-inheritance-dtor-ex": function(env, cout, info){
			info.desc = "the name says it all"
			info.exp = [
			"Base CONSTRUCTOR",
			"Middle CONSTRUCTOR",
			"JEEP: The class 'Derived' could not be instantiated as the constructor raised the exception 'you all suck'. The partial destruction process also failed due to the exception 'yeah, you all suck'.",
			"JEEP: The instance of class 'Derived' could not be destroyed as it raised the exception 'yeah, you all suck'.",
			"JEEP: DESTRUCTOR THROWING EXCEPTION IS A SERIOUS STRUCTURAL ERROR.",
			];
			info.aspects = "field";
			let Base = env.CreateClassDef("Base", {
				CONSTRUCTOR__managed: function(x){
					cout("Base CONSTRUCTOR")
				},
				DESTRUCTOR: function(){
					cout("Base DESTRUCTOR")
				},
				PUBLIC: {
					value: 10,
					f: function(){}
				}
			});
			let Middle = env.CreateClassDef("Middle", {
				EXTENDS: [Base],
				CONSTRUCTOR__managed: function(x){
					cout("Middle CONSTRUCTOR")
				},
				DESTRUCTOR: function(){
					throw "yeah, you all suck"
					cout("Middle DESTRUCTOR")
				},
			});
			let Low = env.CreateClassDef("Low", {
				EXTENDS: [Middle],
				CONSTRUCTOR__managed: function(x){
					throw "you all suck"
					cout("Low DESTRUCTOR")
				},
				DESTRUCTOR: function(){
					cout("Low DESTRUCTOR")
				},
			});
			let Derived = env.CreateClassDef("Derived", {
				EXTENDS: [Low],
				CONSTRUCTOR__managed: function(x){
					cout("Derived CONSTRUCTOR")
				},
				DESTRUCTOR: function(){
					cout("Derived DESTRUCTOR")
				},
			});
			let obj = {};
			env.CreateField(obj, "Field", {
				test__managed: function(){Derived.New()},
			});
			try{obj.test()}catch(e){cout(e)}
		},
		"class-invalid-virtual-ctor": function(env, cout, info){
			info.desc = "the name says it all"
			env = JEEP.CreateEnvironment({mode: env.IsDevMode() ? "development-mode" : "production-mode", 
				client: env.IsClientJeepAware() ? "jeep-aware" : "jeep-agnostic",
				flags: env.IsDevMode() ?  "trap-disabled-virtual-call" : ""})
			if(env.IsDevMode())
				info.exp = [
					"JEEP: Invoking virtual function 'Base.f' in the constructor detected.",
					"JEEP: Invoking virtual function 'Base.f' in the constructor detected.",
				];
			else 
				info.exp = ["ok", "ok"]
			info.aspects = "class, virtual";

			let Base = env.CreateClassDef("Base", {
				PUBLIC: {
					value: 10,
					f__virtual: function(){cout("ok")}
				}
			});
			let Derived = env.CreateClassDef("Derived", {
				EXTENDS: [Base],
				CONSTRUCTOR: function(vcall, vcaller){
					if(vcall===true) this.f();
					if(vcaller)vcaller(this);
				}
			});
			try{Derived.New(true)}catch(e){cout(e)}
			try{Derived.New(false, function(c){c.f()})}catch(e){cout(e)}
		},
		"class-invalid-virtual-dtor": function(env, cout, info){
			info.desc = "the name says it all"
			env = JEEP.CreateEnvironment({mode: env.IsDevMode() ? "development-mode" : "production-mode", 
				client: env.IsClientJeepAware() ? "jeep-aware" : "jeep-agnostic",
				flags: env.IsDevMode() ?  "trap-disabled-virtual-call" : ""})
			if(env.IsDevMode())
				info.exp = [
					"JEEP: The instance of class 'Derived' could not be destroyed since destruction was aborted due to invalid virtual function call.",
					"JEEP: DESTRUCTOR THROWING EXCEPTION IS A SERIOUS STRUCTURAL ERROR.",
					"JEEP: The instance of class 'Derived' could not be destroyed since destruction was aborted due to invalid virtual function call.",
					"JEEP: DESTRUCTOR THROWING EXCEPTION IS A SERIOUS STRUCTURAL ERROR.",
				];
			else 
				info.exp = ["ok", "ok"]
			info.aspects = "class, virtual";

			let Base = env.CreateClassDef("Base", {
				PUBLIC: {
					value: 10,
					f__virtual: function(){cout("ok")}
				}
			});
			let Derived = env.CreateClassDef("Derived", {
				EXTENDS: [Base],
				CONSTRUCTOR__managed: function(vcall, vcaller){
					this.vcall = vcall;
					this.vcaller = vcaller;
				},
				DESTRUCTOR: function(){
					if(this.vcall===true) this.f();
					if(this.vcaller)this.vcaller(this);
				},
				PRIVATE: {
					vcall: false,
					vcaller: null,
				}
			});
			let obj = {};
			env.CreateField(obj, "Field", {
				test__managed: function(vcall, vcaller){
					Derived.New(vcall, vcaller)
				},
			});
			try{obj.test(true)}catch(e){cout(e)}
			try{obj.test(false, function(c){c.f()})}catch(e){cout(e)}
		},
		/* syntax failures */
		"syntax-class-def-badprops": function(env, cout, info){
			info.desc = "tests creating class with invalid properties in the definition"
			if(env.IsDevMode())
				info.exp = [
				"JEEP: CreateClassDef was called with invalid property 'public'.",
				"JEEP: RegisterClassDef was called with invalid property 'public,protected'.",
				]
			else
				info.exp = ["ok"]
			info.aspects = "class"
			try{
				env.CreateClassDef("Test", {
					public: {k: 0}
				})
			}catch(e){cout(e)}
			try{
				env.RegisterClassDef("Test", {
					public: {p: 0},
					protected: {k: 0}
				})
			}catch(e){cout(e)}
			if(!env.IsDevMode())cout("ok")
		},
		"syntax-class-mem-reservedword": function(env, cout, info){
			info.desc = "invokes argtype function with non typedef'd argument"
			if(env.IsDevMode())
			info.exp = [
				"JEEP: Compilation found 2 error(s) for class 'Test'.",
				"1. The word 'virtual' is reserved and hence cannot be used to declare a variable.",
				"2. The word 'managed' is reserved and hence cannot be used to declare a function.",
				"JEEP aborted.",
			];
			else 
				info.exp = ["ok"]
			info.aspects = "class, function directive";
			try{let Class = env.CreateClassDef("Test", {
				PUBLIC: {
					virtual: 0,
					managed: function(){},
					}
			});
			}catch(e){cout(e)}
			if(!env.IsDevMode())cout("ok")
		},	
		"syntax-class-dtor-no-ctor": function(env, cout, info){
			info.desc = "creates a class with destructor but no constructor"
			if(env.IsDevMode())
				info.exp = [
				"JEEP: Compilation found 1 error(s) for class 'Test'.",
				"1. A class cannot have a destructor without a constructor.",
				"JEEP aborted.",
				]
			else
				info.exp = ["ok"]
			info.aspects = "class"
			try{
				env.CreateClassDef("Test", {
					PUBLIC: {dummyvar: 0,f: function(){}},
					DESTRUCTOR: function(){}
				})
			}catch(e){cout(e)}
			if(!env.IsDevMode())cout("ok")
		},
		"syntax-class-novars-nofuncs": function(env, cout, info){
			info.desc = "creates a class with destructor but no constructor"
			if(env.IsDevMode())
				info.exp = [
				"JEEP: Compilation found 2 error(s) for class 'Test'.",
				"1. A class should have variables.",
				"2. A class should have functions.",
				"JEEP aborted.",
				]
			else
				info.exp = ["ok"]
			info.aspects = "class"
			try{
				env.CreateClassDef("Test", {
				})
			}catch(e){cout(e)}
			if(!env.IsDevMode())cout("ok")
		},
		"syntax-class-mem-varfunc": function(env, cout, info){
			info.desc = "creates a class with same member name for both variable and function"
			if(env.IsDevMode())
				info.exp = [
				"JEEP: Compilation found 1 error(s) for class 'Test'.",
				"1. The member 'val' is declared as both variable and function.",
				"JEEP aborted.",
				]
			else
				info.exp = ["ok"]
			info.aspects = "class"
			try{
				env.CreateClassDef("Test", {
					PUBLIC: {
						val: 0,
					},
					PROTECTED: {
						val: function(){}
					}
				})
			}catch(e){cout(e)}
			if(!env.IsDevMode())cout("ok")
		},
		"syntax-class-getter-setter": function(env, cout, info){
			info.desc = "tests the basic setup of class that has public variables, functions and constructor that takes initial value"
			if(env.IsDevMode())
				info.exp = [
				"JEEP: Compilation found 2 error(s) for class 'Test'.",
				"1. The function 'getProtval' cannot be generated for the variable 'protval' since a function by that name already exists.",
				"2. The function 'setPrivval' cannot be generated for the variable 'privval' since a function by that name already exists.",
				"JEEP aborted.",
				]
			else
				info.exp = ["ok"];
			info.aspects = "class";
			try{
			let Class = env.CreateClassDef("Test", {
				CONSTRUCTOR: function(x){
					cout(this.$name)
					this.value = x;
				},
				PUBLIC: {
					value__get_set: 10,
					print: function(){cout("value =", this.value)}
				},
				PROTECTED: {
					protval__get_set: 33,
					getProtval: function(){}
				},
				PRIVATE: {
					privval__get_set: -1,
					setPrivval: function(){}
				}
			});
			}catch(e){cout(e)}
			if(!env.IsDevMode())cout("ok")
		},
		"syntax-class-setter-constant": function(env, cout, info){
			info.desc = "tests the basic setup of class that has public variables, functions and constructor that takes initial value"
			if(env.IsDevMode())
				info.exp = [
				"JEEP: Compilation found 1 error(s) for class 'Test'.",
				"1. The function 'setProtval' cannot be generated for the variable 'protval' since it is declared as constant.",
				"JEEP aborted.",
				]
			else
				info.exp = ["ok"];
			info.aspects = "class";
			try{
			let Class = env.CreateClassDef("Test", {
				CONSTRUCTOR: function(x){
					cout(this.$name)
					this.value = x;
				},
				PUBLIC: {
					value__get_set: 10,
					print: function(){cout("value =", this.value)}
				},
				PROTECTED: {
					protval__get_set_const: 33,
				},
			});
			}catch(e){cout(e)}
			if(!env.IsDevMode())cout("ok")
		},
		"syntax-class-mem-multiple-access": function(env, cout, info){
			info.desc = "creates a class with same member name in multople access groups"
			if(env.IsDevMode())
				info.exp = [
				"JEEP: Compilation found 2 error(s) for class 'Test'.",
				"1. The variable 'val' is declared with multiple access restrictions.",
				"2. The function 'func' is declared with multiple access restrictions.",
				"JEEP aborted.",
				]
			else
				info.exp = ["ok"]
			info.aspects = "class"
			try{
				env.CreateClassDef("Test", {
					PUBLIC: {
						val: 0,
						func: function(){}
					},
					PROTECTED: {
						val: 0,
						func: function(){}
					}
				})
			}catch(e){cout(e)}
			if(!env.IsDevMode())cout("ok")
		},
		"syntax-class-constructor-directive": function(env, cout, info){
			info.desc = "tests with wrong argument count"
			if(env.IsDevMode())
				info.exp = [
					"JEEP: Compilation found 1 error(s) for class 'Test'.",
					"1. Constructor can only have 'managed' directive.",
					"JEEP aborted.",
					"ok"
				];
			else
				info.exp = ["ok"]
			info.aspects = "class, function directive";
			try{
			let Class = env.CreateClassDef("Test", {
				CONSTRUCTOR__const: function(){},
				PUBLIC: {
					dummyvar: 0,
					dummyfunc: function(){},
				}
			});
			}catch(e){cout(e)}
			cout("ok")
		},
		"syntax-class-managed-destructor-missing": function(env, cout, info){
			info.desc = "tests with wrong argument count"
			info.exp = [
				"JEEP: Compilation found 1 error(s) for class 'Test'.",
				"1. Destructor should be defined for a class declared as 'managed'.",
				"JEEP aborted.",
			];
			info.aspects = "class, function directive";
			try{
			let Class = env.CreateClassDef("Test", {
				CONSTRUCTOR__managed: function(){},
				PUBLIC: {
					dummyvar: 0,
					dummyfunc: function(){},
				}
			});
			}catch(e){cout(e)}
		},
		"syntax-class-argtype-fail-def": function(env, cout, info){
			info.desc = "tests with bad function definition"
			info.exp = [
				"JEEP: Compilation found 1 error(s) for class 'Test'.",
				"1. The function 'func' with the 'argtype' directive doesn't have the correct function definition.",
				"JEEP aborted.",
			];
			info.aspects = "class, function directive";
			try{
			let Class = env.CreateClassDef("Test", {
				PUBLIC: {
					dummyvar: 0,
					func__argtype: function(n__number, s__string, a__array, ob__object){
						let k = 0;
						return function(n,s,a,ob){
							cout(n,s,a,JSON.stringify(ob))
						}
					}
				}
			});
			}catch(e){cout(e)}
		},
		"syntax-class-argtype-fail-notype": function(env, cout, info){
			info.desc = "tests with bad function definition"
			info.exp = [
				"JEEP: Compilation found 1 error(s) for class 'Test'.",
				"1. The function 'func' with the 'argtype' directive should have at least one typed argument.",
				"JEEP aborted.",
			];
			info.aspects = "class, function directive";
			try{
			let Class = env.CreateClassDef("Test", {
				PUBLIC: {
					dummyvar: 0,
					func__argtype: function(a,b,c){
						return function(a,b,c){}
					}
				}
			});
			}catch(e){cout(e)}
		},
		"syntax-class-argtype-fail-count": function(env, cout, info){
			info.desc = "tests with wrong argument count"
			info.exp = [
				"JEEP: Compilation found 1 error(s) for class 'Test'.",
				"1. The function 'func' with the 'argtype' directive has mismatched argument count.",
				"JEEP aborted.",
			];
			info.aspects = "class, function directive";
			try{
			let Class = env.CreateClassDef("Test", {
				PUBLIC: {
					dummyvar: 0,
					func__argtype: function(n__number, s__string, a__array, ob__object){
						return function(n,s,ob){
							cout(n,s,a,JSON.stringify(ob))
						}
					}
				}
			});
			}catch(e){cout(e)}
		},
		"syntax-class-argtype-fail-names": function(env, cout, info){
			info.desc = "tests with wrong argument count"
			info.exp = [
				"JEEP: Compilation found 1 error(s) for class 'Test'.",
				"1. The function 'func' with the 'argtype' directive has mismatched argument names.",
				"JEEP aborted.",
			];
			info.aspects = "class, function directive";
			try{
			let Class = env.CreateClassDef("Test", {
				PUBLIC: {
					dummyvar: 0,
					func__argtype: function(n__number, s__string, a__array, ob__object){
						return function(n,s,x,ob){
							cout(n,s,a,JSON.stringify(ob))
						}
					}
				}
			});
			}catch(e){cout(e)}
		},
		"syntax-class-argtype-reservedword": function(env, cout, info){
			info.desc = "invokes argtype function with non typedef'd argument"
			if(env.IsDevMode())
			info.exp = [
				"JEEP: Compilation found 1 error(s) for class 'Test'.",
				"1. The word 'virtual' is reserved and hence cannot be used to declare a function argument.",
				"JEEP aborted.",
			];
			else 
				info.exp = ["ok"]
			info.aspects = "class, function directive";
			try{let Class = env.CreateClassDef("Test", {
				PUBLIC: {
					dummyvar: 0,
					func__argtype: function(virtual__number){
						return function(virtual){
						}
					}
				}
			});
			}catch(e){cout(e)}
			if(!env.IsDevMode())cout("ok")
		},	
		"syntax-class-static-directives": function(env, cout, info){
			info.desc = "creates a class with sttaic members with invalid directives"
			if(env.IsDevMode())
				info.exp = [
				"JEEP: Compilation found 2 error(s) for class 'Test'.",
				"1. The static variable 'v' uses invalid directive(s) 'const'.",
				"2. The static function 'f' uses invalid directive(s) 'virtual,argnum'.",
				"JEEP aborted.",
				]
			else
				info.exp = ["ok"]
			info.aspects = "class"
			try{
				env.CreateClassDef("Test", {
					PUBLIC: {dummyvar: 0, dummyfunc: function(){}},
					STATIC: {
						f__virtual_argnum: function(){},
						v__const: 0,
					}
				})
			}catch(e){cout(e)}
			if(!env.IsDevMode())cout("ok")
		},
		"syntax-class-argnum-argnumvar": function(env, cout, info){
			info.desc = "creates a class a function declared both abstract and virtual"
			if(env.IsDevMode())
				info.exp = [
				"JEEP: Compilation found 1 error(s) for class 'Test'.",
				"1. The function 'func' has the directive combination 'argnum,argnumvar' set which is invalid.",
				"JEEP aborted.",
				]
			else
				info.exp = ["ok"]
			info.aspects = "class"
			try{
				env.CreateClassDef("Test", {
					PUBLIC: {
						val: 0,
					},
					PROTECTED: {
						func__argnum_argnumvar: function(){}
					}
				})
			}catch(e){cout(e)}
			if(!env.IsDevMode())cout("ok")
		},
		"syntax-class-virtual-args": function(env, cout, info){
			info.desc = "tests virtual function mechanism in a three level single inheritance along with $base usage";
			if(env.IsDevMode())
				info.exp = [
				"JEEP: Compilation found 1 error(s) for class 'Derived'.",
				"1. The virtual function 'doprint' is defined with different number of arguments in the hierarchy.",
				"JEEP aborted.",
				]
			else
				info.exp = ["ok"]
			info.aspects = "class, virtual"
			try{
			let TopBase = env.CreateClassDef("TopBase", {
				PUBLIC: {
					value: 10,
					print: function(){this.doprint()},
					doprint__abstract: function(){},
				}
			});
			let MidBase = env.CreateClassDef("MidBase", {
				EXTENDS: [TopBase],
				PUBLIC: {
					mvalue: 20,
					doprint__virtual: function(){
						this.$base.TopBase.doprint();
						cout("MidBase value:", this.mvalue)
					}
				}
			});
			let Derived = env.CreateClassDef("Derived", {
				EXTENDS: [MidBase],
				PUBLIC: {
					dvalue: 30,
					doprint__virtual: function(x){
						this.$base.MidBase.doprint();
						cout("Derived value:", this.dvalue)
					}
				}
			});}catch(e){cout(e)}
			if(!env.IsDevMode())cout("ok")
		},
		"syntax-class-virtual-directives": function(env, cout, info){
			info.desc = "tests virtual function mechanism in a three level single inheritance along with $base usage";
			if(env.IsDevMode())
				info.exp = [
				"JEEP: Compilation found 1 error(s) for class 'Derived'.",
				"1. The virtual function 'doprint' is defined with different directives in the hierarchy.",
				"JEEP aborted.",
				]
			else
				info.exp = ["ok"]
			info.aspects = "class, virtual"
			try{
			let TopBase = env.CreateClassDef("TopBase", {
				PUBLIC: {
					value: 10,
					print: function(){this.doprint()},
					doprint__abstract_const: function(){},
				}
			});
			let MidBase = env.CreateClassDef("MidBase", {
				EXTENDS: [TopBase],
				PUBLIC: {
					mvalue: 20,
					doprint__virtual_const: function(){
						this.$base.TopBase.doprint();
						cout("MidBase value:", this.mvalue)
					}
				}
			});
			let Derived = env.CreateClassDef("Derived", {
				EXTENDS: [MidBase],
				PUBLIC: {
					dvalue: 30,
					doprint__virtual: function(){
						this.$base.MidBase.doprint();
						cout("Derived value:", this.dvalue)
					}
				}
			});}catch(e){cout(e)}
			if(!env.IsDevMode())cout("ok")
		},
		"syntax-class-virtual-abstract": function(env, cout, info){
			info.desc = "creates a class a function declared both abstract and virtual"
			if(env.IsDevMode())
				info.exp = [
				"JEEP: Compilation found 1 error(s) for class 'Test'.",
				"1. The function 'func' has the directive combination 'virtual,abstract' set which is invalid.",
				"JEEP aborted.",
				]
			else
				info.exp = ["ok"]
			info.aspects = "class"
			try{
				env.CreateClassDef("Test", {
					PUBLIC: {
						val: 0,
					},
					PROTECTED: {
						func__abstract_virtual: function(){}
					}
				})
			}catch(e){cout(e)}
			if(!env.IsDevMode())cout("ok")
		},
		"class-single-inheritance-dupnames": function(env, cout, info){
			info.desc = "tests the single inheritance setup with public members and constructors (TopBase, MidBase and Derived)"
			if(env.IsDevMode())
				info.exp = [
				"JEEP: Compilation found 2 error(s) for class 'MidBase'.",
				"1. The variable 'value' is found in multiple places in the hierarchy 'TopBase,MidBase'.",
				"2. The function 'print' is found in multiple places in the hierarchy 'TopBase,MidBase'.",
				"JEEP aborted."
				];
			else
				info.exp = ["ok"]
			info.aspects = "class, inheritance";
			let TopBase = env.CreateClassDef("TopBase", {
				CONSTRUCTOR: function(){cout("TopBase CONSTRUCTOR")},
				PUBLIC: {
					value: 10,
					print: function(){cout("TopBase value:", this.value)}
				}
			});
			try{
			env.CreateClassDef("MidBase", {
				EXTENDS: [TopBase],
				CONSTRUCTOR: function(){cout("MidBase CONSTRUCTOR")},
				PUBLIC: {
					value: 10,
					print: function(){cout("TopBase value:", this.value)}
				}
			});
			}catch(e){cout(e)}
			if(!env.IsDevMode())cout("ok")
		},
		"class-multiple-inheritance-dupnames": function(env, cout, info){
			info.desc = "tests multiple inheritance with abstract functions in single level with one base registered"
			if(env.IsDevMode())
				info.exp = [
				"JEEP: Compilation found 3 error(s) for class 'Derived'.",
				"1. The variable 'dummyvar' is found in multiple places in the hierarchy 'BaseA,BaseB'.",
				"2. The function 'work' is found in multiple places in the hierarchy 'BaseA,BaseB,Derived'.",
				"3. The function 'action' is found in multiple places in the hierarchy 'BaseA,BaseB'.",
				"JEEP aborted."
				];
			else
				info.exp = ["ok"]
			info.aspects = "class, inheritance, abstract";
			env.RegisterClassDef("BaseA", {
				PUBLIC: {
					dummyvar: 0,
					work__virtual: function(){this.actionA();}
				},
				PRIVATE: {
					action__abstract: function(){}
				}
			});
			let BaseB = env.CreateClassDef("BaseB", {
				PUBLIC: {
					dummyvar: 0,
					work: function(){this.actionB()}
				},
				PRIVATE: {
					action__abstract: function(){}
				}
			});
			try{let Derived = env.CreateClassDef("Derived", {
				EXTENDS: ["BaseA", BaseB],
				PUBLIC: {
					work: function(){this.workA();this.workB()}
				},
				PRIVATE: {
					actionA__virtual: function(){cout("actionA")},
					actionB__virtual: function(){cout("actionB")}
				}
			});}catch(e){cout(e)}
			if(!env.IsDevMode())cout("ok")
		},
		"class-multiple-inheritance-ctor-managed": function(env, cout, info){
			info.desc = "tests multiple inheritance with abstract functions in single level with one base registered"
			if(env.IsDevMode())
				info.exp = [
				"JEEP: Compilation found 1 error(s) for class 'Derived'.",
				"1. The constructor should be declared 'managed' since the base class does so.",
				"JEEP aborted."
				];
			else
				info.exp = ["ok"]
			info.aspects = "class, inheritance, abstract";
			env.RegisterClassDef("BaseA", {
				CONSTRUCTOR__managed: function(){},
				DESTRUCTOR: function(){},
				PUBLIC: {
					dummyvar1: 0,
					work1: function(){this.actionA();}
				},
				PRIVATE: {
					action1__abstract: function(){}
				}
			});
			let BaseB = env.CreateClassDef("BaseB", {
				PUBLIC: {
					dummyvar2: 0,
					work2: function(){this.actionB()}
				},
				PRIVATE: {
					action2__abstract: function(){}
				}
			});
			try{let Derived = env.CreateClassDef("Derived", {
				EXTENDS: ["BaseA", BaseB],
				CONSTRUCTOR: function(){},
				PUBLIC: {
					work: function(){this.workA();this.workB()}
				},
				PRIVATE: {
					actionA__virtual: function(){cout("actionA")},
					actionB__virtual: function(){cout("actionB")}
				}
			});}catch(e){cout(e)}
			if(!env.IsDevMode())cout("ok")
		},
		"syntax-class-abstract-defined": function(env, cout, info){
			info.desc = "creates a class with destructor but no constructor"
			if(env.IsDevMode())
				info.exp = [
				"JEEP: Compilation found 2 error(s) for class 'Test'.",
				"1. The abstract function 'func2' is defined.",
				"2. The abstract function 'func3' is defined.",
				"JEEP aborted.",
				]
			else
				info.exp = ["ok"]
			info.aspects = "class"
			try{
				env.CreateClassDef("Test", {
					PUBLIC: {
						dummyvar: 0,
						func1__abstract: function(){},
						func2__abstract: function(){;},// not even semicolon
						func3__abstract: function(){return false;},
					},
				})
			}catch(e){cout(e)}
			if(!env.IsDevMode())cout("ok")
		},
		"class-wrapper-instantiated": function(env, cout, info){
			info.desc = "tries to wrap an class with same names of non existant variables and functions",
			info.exp = ["JEEP: The wrapper for the class 'TopBase' was instantiated. Wrappers are not meant to be used as instances."];
			info.aspects = "class, wrapper";
			env.RegisterClassDef("TopBase", {
				CONSTRUCTOR: function(x){this.value = x},
				PUBLIC: {
					value: 37,
					start: function(x){this.perform(x)},
					perform: function(x){cout("performing", x, this.value)},
				}
			});
			let W = env.CreateClassWrapper("TopBase", {
				Functions: {
					"start": "runTasks"
				},
			});
			try{new W}catch(e){cout(e)}
		},
		"class-wrapper-badprops": function(env, cout, info){
			info.desc = "calls CreateClassWrapper with invalid properties",
			info.exp = ["JEEP: CreateClassWrapper was called with invalid property 'FUNCTIONS,VARIABLES'."];
			info.aspects = "class, wrapper";
			env.RegisterClassDef("TopBase", {
				CONSTRUCTOR: function(x){this.value = x},
				PUBLIC: {
					value: 37,
					start: function(x){this.perform(x)},
					perform: function(x){cout("performing", x, this.value)},
				}
			});
			try{env.CreateClassWrapper("TopBase", {
				FUNCTIONS: {
					"perform": "runTasks"
				},
				VARIABLES: {
					"value": "number"
				}
			})}catch(e){cout(e)}
		},
		"class-wrapper-unreg": function(env, cout, info){
			info.desc = "tries to wrap an unregistered class",
			info.exp = ["JEEP: CreateClassWrapper failed for 'Test' since the class is not registered."];
			info.aspects = "class, wrapper";
			env.RegisterClassDef("TopBase", {
				CONSTRUCTOR: function(x){this.value = x},
				PUBLIC: {
					value: 37,
					start: function(x){this.perform(x)},
					perform: function(x){cout("performing", x, this.value)},
				}
			});
			try{env.CreateClassWrapper("Test", {
				Functions: {
					"perform": "runTasks"
				},
				Variables: {
					"value": "number"
				}
			})}catch(e){cout(e)}
		},
		"class-wrapper-nomap": function(env, cout, info){
			info.desc = "tries to wrap an class with no map",
			info.exp = ["JEEP: CreateClassWrapper failed for 'TopBase' since the definition has neither variable nor function map."];
			info.aspects = "class, wrapper";
			env.RegisterClassDef("TopBase", {
				CONSTRUCTOR: function(x){this.value = x},
				PUBLIC: {
					value: 37,
					start: function(x){this.perform(x)},
					perform: function(x){cout("performing", x, this.value)},
				}
			});
			try{env.CreateClassWrapper("TopBase", {
			})}catch(e){cout(e)}
		},
		"class-wrapper-badvalues": function(env, cout, info){
			info.desc = "tries to wrap an class with same names of non existant variables and functions",
			info.exp = [
			"JEEP: Compilation found 2 error(s) for wrapper class 'TopBase'.",
			"1. The variables map contains these non string values 'value'.",
			"2. The functions map contains these non string values 'start,perform'.",
			"JEEP aborted."
			];
			info.aspects = "class, wrapper";
			env.RegisterClassDef("TopBase", {
				CONSTRUCTOR: function(x){this.value = x},
				PUBLIC: {
					value: 37,
					start: function(x){this.perform(x)},
					perform: function(x){cout("performing", x, this.value)},
				}
			});
			try{env.CreateClassWrapper("TopBase", {
				Variables: {value: {}},
				Functions: {
					"start": 1,
					perform: [10, 10,]
				},
			});
			}catch(e){cout(e)}
		},
		"class-wrapper-ctor-managed": function(env, cout, info){
			info.desc = "tests multiple inheritance with abstract functions in single level with one base registered"
			if(env.IsDevMode())
				info.exp = [
				"JEEP: Compilation found 1 error(s) for class 'Derived'.",
				"1. The constructor should be declared 'managed' since the base class does so.",
				"JEEP aborted."
				];
			else
				info.exp = ["ok"]
			info.aspects = "class, inheritance, abstract";
			env.RegisterClassDef("TopBase", {
				CONSTRUCTOR__managed: function(x){this.value = x},
				DESTRUCTOR: function(){},
				PUBLIC: {
					value: 37,
					start: function(x){this.perform(x)},
					perform: function(x){cout("performing", x, this.value)},
				}
			});
			let Wrapper = env.CreateClassWrapper("TopBase", {
				Functions: {
					"perform": "runTasks"
				},
				Variables: {
					"value": "number"
				}
			})
			try{let Derived = env.CreateClassDef("Derived", {
				EXTENDS: [Wrapper],
				CONSTRUCTOR: function(x){this.number *= 2},
				PUBLIC: {
					work: function(x){cout("working", x, this.number)},
				}
			})}catch(e){cout(e)}
			if(!env.IsDevMode())cout("ok")
		},
		"class-wrapper-invalid-names": function(env, cout, info){
			info.desc = "tries to wrap an class with same names of non existant variables and functions",
			info.exp = [
			"JEEP: Compilation found 2 error(s) for wrapper class 'TopBase'.",
			"1. The class cannot be wrapped due to these missing variables 'rate'.",
			"2. The class cannot be wrapped due to these missing functions 'value'.",
			"JEEP aborted."
			];
			info.aspects = "class, wrapper";
			env.RegisterClassDef("TopBase", {
				CONSTRUCTOR: function(x){this.value = x},
				PUBLIC: {
					value: 37,
					start: function(x){this.perform(x)},
					perform: function(x){cout("performing", x, this.value)},
				}
			});
			try{env.CreateClassWrapper("TopBase", {
				Functions: {
					"value": "runTasks"
				},
				Variables: {
					"rate": "number"
				}
			})}catch(e){cout(e)}
		},
		/***************************
		***** field
		****************************/		
		"syntax-field-empty": function(env, cout, info){
			info.desc = "tests basic setup of fields with variables"
			if(env.IsDevMode())
				info.exp = [
					"JEEP: Compilation found 1 error(s) for field 'Field'.",
					"1. A field should consist atleast one function.",
					"JEEP aborted.",
				];
			else
				info.exp = ["ok"]
			info.aspects = "field";
			try{env.CreateField({}, "Field", {
			});}catch(e){cout(e)}
			if(!env.IsDevMode())cout("ok")
		},
		"syntax-field-dupnames": function(env, cout, info){
			info.desc = "tests basic setup of fields with variables"
			if(env.IsDevMode())
				info.exp = [
					"JEEP: Compilation found 1 error(s) for field 'Field'.",
					"1. The field object already contains members with names 'print,work'.",
					"JEEP aborted.",
				];
			else
				info.exp = ["ok"]
			info.aspects = "field";
			try{env.CreateField({print: 0, work: 0}, "Field", {
				print: function(){},
				work: function(){},
			});}catch(e){cout(e)}
			if(!env.IsDevMode())cout("ok")
		},
		"syntax-field-with-variables": function(env, cout, info){
			info.desc = "tests basic setup of fields with variables"
			if(env.IsDevMode())
				info.exp = [
					"JEEP: Compilation found 1 error(s) for field 'Test'.",
					"1. A field should consist only functions and not variables.",
					"JEEP aborted.",
				];
			else
				info.exp = ["ok"]
			info.aspects = "field";
			try{
			env.RegisterField("Test", {
				val: 10,
				print: function(){cout("ok")}
			});}catch(e){cout(e)}
			if(!env.IsDevMode())cout("ok")
		},
		"syntax-field-invalid-directives": function(env, cout, info){
			info.desc = "tests field with invalid function directives (abstract,virtual,replace,const)"
			if(env.IsDevMode())
				info.exp = [
					"JEEP: Compilation found 3 error(s) for field 'Field'.",
					"1. The function 'print1' uses directives which are invalid for fields.",
					"2. The function 'print2' uses directives which are invalid for fields.",
					"3. The function 'print3' uses directives which are invalid for fields.",
					"JEEP aborted.",
				];
			else
				info.exp = ["ok"]
			info.aspects = "field";
			try{
			env.CreateField({}, "Field", {
				print1__abstract: function(){cout("ok")},
				print2__virtual: function(a){cout("ok")},
				print3__const: function(a__number){return function(a){cout("ok")}},
			});}catch(e){cout(e)}
			if(!env.IsDevMode())cout("ok")
		},
		/***************************
		***** group
		****************************/		
		"syntax-group-dupnames": function(env, cout, info){
			info.desc = "tests basic setup of fields with variables"
			if(env.IsDevMode())
				info.exp = [
					"JEEP: Compilation found 1 error(s) for group 'Field'.",
					"1. The group object already contains members with names 'print,work'.",
					"JEEP aborted.",
				];
			else
				info.exp = ["ok"]
			info.aspects = "group";
			try{env.CreateGroup({print: 0, work: 0}, "Field", {
				PUBLIC: {
					print: function(){},
					work: function(){},
				},
			});}catch(e){cout(e)}
			if(!env.IsDevMode())cout("ok")
		},
		"group-access-fail": function(env, cout, info){
			info.desc = "tests class access restriction";
			if(env.IsDevMode())
				info.exp = [
					"pubval: 1", "privval: 3", 
					"privval: 4",
					"JEEP: Attempt to write private variable 'Test.privval' detected.",
					];
			else
				info.exp = [
					"pubval: 1", "privval: 3", 
					"privval: 4",
				]
			info.aspects = "group, access";
			let grp = {};
			let Class = env.CreateGroup(grp, "Test", {
				PUBLIC: {
					pubval: 1,
					pubprint: function(f){
						cout("pubval:",this.pubval);
						this.pubprint2();
						f(this);
					},
					pubprint2: function(){
						this.privprint();
					}
				},
				PRIVATE: {
					privval: 3,
					privprint: function(){
						cout("privval:",this.privval)
					}
				}
			});
			grp.pubprint(function(c){
				grp.privval++; 
				grp.privprint()
			});
			try{grp.privval = 10;}catch(e){cout(e)}
		},
		"syntax-group-def-badprops": function(env, cout, info){
			info.desc = "tests creating class with invalid properties in the definition"
			if(env.IsDevMode())
				info.exp = [
				"JEEP: CreateGroup was called with invalid property 'DESTRUCTOR,public,STATIC'.",
				"JEEP: RegisterGroup was called with invalid property 'public,protected'.",
				]
			else
				info.exp = ["ok"]
			info.aspects = "class"
			try{
				env.CreateGroup({}, "Test", {
					DESTRUCTOR: function(){},
					public: {k: 0},
					STATIC: {},
					PUBLIC: {
						f: function(){},
					}
				})
			}catch(e){cout(e)}
			try{
				env.RegisterGroup("Test", {
					public: {p: 0},
					protected: {k: 0}
				})
			}catch(e){cout(e)}
			if(!env.IsDevMode())cout("ok")
		},
		"syntax-group-invalid-directives": function(env, cout, info){
			info.desc = "tests creating class with invalid properties in the definition"
			if(env.IsDevMode())
				info.exp = [
				"JEEP: Compilation found 3 error(s) for group 'Test'.",
				"1. The function 'f2' uses invalid directive(s) 'virtual'.",
				"2. The function 'f3' uses invalid directive(s) 'abstract'.",
				"3. A group cannot have constructor with directives.",
				"JEEP aborted.",
				]
			else
				info.exp = ["ok"]
			info.aspects = "class"
			try{
				env.CreateGroup({}, "Test", {
					CONSTRUCTOR__managed: function(){},
					PUBLIC: {
						k: 0,
						f__const: function(){},
						f2__virtual: function(){},
						f3__abstract: function(){},
					},
				})
			}catch(e){cout(e)}
			if(!env.IsDevMode())cout("ok")
		},
		"syntax-group-novars-nofuncs": function(env, cout, info){
			info.desc = "creates a class with destructor but no constructor"
			if(env.IsDevMode())
				info.exp = [
				"JEEP: Compilation found 1 error(s) for group 'Test'.",
				"1. A group should have functions.",
				"JEEP aborted.",
				]
			else
				info.exp = ["ok"]
			info.aspects = "class"
			try{
				env.CreateGroup(null, "Test", {
				})
			}catch(e){cout(e)}
			if(!env.IsDevMode())cout("ok")
		},
		/***************************
		***** namespace
		****************************/
		"namespace-partition-duplicate": function(env, cout, info){
			info.desc = "tests the namsepace partition mechanism"
			if(env.IsDevMode())
				info.exp = ["JEEP: The namespace already has these partitions 'first,second'."]
			else
				info.exp = ["ok"]
			info.aspects = "namespace";
			let ns = env.CreateNamespace();
			ns.Partition("first, second");
			try{ns.Partition("first, second");}catch(e){cout(e)}
			if(!env.IsDevMode())cout("ok")
		},
		"namespace-flatten-duplicate": function(env, cout, info){
			info.desc = "tests the namsepace flattening mechanism on tree layout"
			if(env.IsDevMode())
				info.exp = ["JEEP: The namespace cannot be flattened due to duplicate branch names (x,y)."];// depth first
			else
				info.exp = ["ok"]
			info.aspects = "namespace";
			let ns = env.CreateNamespace();
			ns.Partition("a, b");
			ns.$.a.Partition("x,y,z");
			ns.$.b.Partition("x,y");
			try{ns.Flatten();}catch(e){cout(e)}
			if(!env.IsDevMode())cout("ok")
		},	
		/***************************
		***** library
		****************************/
		"library-duplicate": function(env, cout, info){
			info.desc = "tests library setup"
			info.exp = ["JEEP: Registering the library 'Lib' failed since there is already a library by that name registered."];
			info.aspects = "library";
			JEEP.RegisterLibrary("Lib", function(x){				
				cout("initializing library...")
				this.namespace.RegisterRecordDef("Rec", {val: x});
			})
			try{JEEP.RegisterLibrary("Lib", function(x){				
				cout("initializing library...")
				this.namespace.RegisterRecordDef("Rec", {val: x});
			})}catch(e){cout(e)}
		},		
		"library-unregistered": function(env, cout, info){
			info.desc = "tests library setup"
			info.exp = ["JEEP: Unable to get the library 'Lib' since it is not registered."];
			info.aspects = "library";
			try{let Lib = env.GetLibrary("Lib", 10);}catch(e){cout(e)}
		},		
		// "library-invalid-builder": function(env, cout, info){
		// 	info.desc = "tests library BuildPrivate mechanism with nested builder"
		// 	info.exp = ["JEEP: The builder 'a' for the library 'Lib' invoked with BuildPrivate was supplied wrong property 'buuilder,arrgs'."];
		// 	info.aspects = "library";
		// 	function morebuilder(x){
		// 		this.namespace.RegisterRecordDef("Rec", {val: x});				
		// 	}
		// 	function builder(x){
		// 		let ns = this.BuildPrivate({
		// 			"a": {buuilder: morebuilder, arrgs: 33}
		// 		})
		// 		ns = ns.Flatten();
		// 		let R = ns.a.GetObjectDef("Rec");
		// 		let r = R.New();
		// 		this.namespace.RegisterRecordDef("Rec", {val: x + r.val});				
		// 	}
		// 	JEEP.RegisterLibrary("Lib", function(x){				
		// 		this.Build({
		// 			"a": {builder: builder, args: x*100}
		// 		})
		// 	})
		// 	try{let Lib = env.GetLibrary("Lib", 2);
		// 	Lib = Lib.Flatten();// if the mechanism fails, this will raise exception due to duplicate artition
		// 	let R = Lib.a.GetObjectDef("Rec");
		// 	let r = R.New();
		// 	cout(r.val);}catch(e){cout(e)}
		// },		
	},
	pmcTests: {
		"pmc-struct-access": function(env, cout, info){
			info.desc = "tests the access restriction of structure"
			info.exp = [
			"JEEP: Attempt to write private variable 'Test.value' detected.", 
			"JEEP: Attempt to access private function 'Test.change' detected.", 
			"Test value = 10"
			];
			info.aspects = "struct";
			let Struct = env.CreateStructDef("Test", {
				PMC: "pmc-memaccess",
				CONSTRUCTOR: function(x){this.change(x);},
				print: function(){cout(this.$name, "value =", this.value)},
				value__private: 0,
				change__private: function(v){this.value = v},
			});
			let s = Struct.New(10);
			try{s.value = -1}catch(e){cout(e)}
			try{s.change(-2)}catch(e){cout(e)}
			s.print();			
		},		
		"pmc-class-access": function(env, cout, info){
			info.desc = "tests class access restriction";
			info.exp = [
				"JEEP: Attempt to invoke protected function 'Test.protprint' detected.",
				"pubval: 1", "privval: 3", 
				"protval: 2", "privval: 3", "privval: 4",
				"JEEP: Attempt to read private variable 'Test.privval' detected.",
				"JEEP: Attempt to write private variable 'Test.privval' detected.",
				];
			info.aspects = "class, access";
			let Class = env.CreateClassDef("Test", {
				PMC: "pmc-memaccess",
				PUBLIC: {
					pubval: 1,
					pubprint: function(f){
						cout("pubval:",this.pubval);
						this.pubprint2();
						this.protprint();
						f(this);
						try{this.ExternalCall(f, this);}catch(e){cout(e)}
					},
					pubprint2: function(){
						this.privprint();
					}
				},
				PROTECTED: {
					protval: 2,
					protprint: function(){
						cout("protval:",this.protval);
						this.privprint();
					},
				},
				PRIVATE: {
					privval: 3,
					privprint: function(){
						cout("privval:",this.privval)
					}
				}
			});
			let c = Class.New();
			try{c.protprint();}catch(e){cout(e)}
			c.pubprint(function(c){
				c.privval++; 
				c.privprint()
			});
			try{c.privval = 10;}catch(e){cout(e)}
		},
		"pmc-class-static-access": function(env, cout, info){
			info.desc = "tests static member setup, including sharing across instances";
			info.exp = ["private static value: 20",
			"public static value: 10",
			"JEEP: Attempt to read private static variable 'Class.privvalue' detected.",
			"private static value: 20",
			"private static value: -1",
			];
			info.aspects = "static";
			let Class = env.CreateClassDef("Class", {
				PMC: "pmc-memaccess",
				PUBLIC: {
					dummyvar: 0,
					work: function(){
						cout("private static value:", this.$static.privvalue)
					},
					change: function(x){this.$static.privvalue = x},
				},
				STATIC: {
					pubvalue__public: 10,					
					privvalue__private: 20,	
					work__public: function(){cout("private static value:", this.privvalue)}				
				}
			})
			let c = Class.New();
			c.work();
			cout("public static value:",Class.STATIC.pubvalue);
			try{cout("private static value:", Class.STATIC.privvalue)}catch(e){cout(e)}
			Class.STATIC.work();
			c.change(-1);
			let d = Class.New();
			d.work();
		},		
		"pmc-class-access-multiple-instance": function(env, cout, info){
			info.desc = "tests class access restriction with multiple instances";
			info.exp = ["pubval: 1", "privval: 3","JEEP: Attempt to invoke private function 'Test.privprint' detected.",];
			info.aspects = "class, access";
			let Class = env.CreateClassDef("Test", {
				PMC: "pmc-memaccess",
				PUBLIC: {
					pubval: 1,
					pubprint: function(f, g){
						cout("pubval:",this.pubval);
						f(this);// this is friend of this instance, so won't raise exception
						this.ExternalCall(g);// this will, as it works with another instance, see below
					},
				},
				PRIVATE: {
					privval: 3,
					privprint: function(){
						cout("privval:",this.privval)
					}
				}
			});
			let c = Class.New();
			let d = Class.New();
			c.pubprint(function(x){
				try{x.privprint()}catch(e){cout(e)}
			},function(){
				try{d.privprint()}catch(e){cout(e)}
			});
		},
		"pmc-class-const-func": function(env, cout, info){
			info.desc = "tests that constant function directive works"
			info.exp = [
				"JEEP: Attempt to change the variable 'Test.value' inside constant function detected. Call trace: [Test.print,Test.work].",
			];
			info.aspects = "class, function directive";
			let Class = env.CreateClassDef("Test", {
				PMC: "pmc-constant-function",
				PUBLIC: {
					value: 10,
					print__const: function(){this.work()},
					work: function(){this.value = 100},
				}
			});
			let c = Class.New();
			try{c.print();}catch(e){cout(e)}
		},
		"pmc-class-const-var": function(env, cout, info){
			info.desc = "tests that constant variable directive works (pod and object)"
			info.exp = [
				"JEEP: Attempt to change constant variables 'Test.obj' detected. Call trace: [Test.funcA].",
				"JEEP: Attempt to change constant variable 'Test.value' by non member function detected.",
				];
			info.aspects = "class, function directive";
			let Class = env.CreateClassDef("Test", {
				PMC: "pmc-constant-variable",
				PUBLIC: {
					value__const: 10,
					obj__const: {a: 10},
					funcA: function(f){f(this)}
				}
			});
			let c = Class.New();
			try{c.funcA(function(x){x.obj.a=0})}catch(e){cout(e)}
			try{c.value = 0}catch(e){cout(e)}
		},
		"pmc-class-argnum": function(env, cout, info){
			info.desc = "tests the argnum directive, validating arguments count"
			info.exp = [
				"JEEP: The function 'Test.func' was invoked with wrong argument count (declared: 2, given: 1).",
				];
			info.aspects = "class, function directive";
			let Class = env.CreateClassDef("Test", {
				PMC: "pmc-argnum",
				PUBLIC: {
					dummyvar: 0,
					func__argnum: function(f, g){}
				}
			});
			let c = Class.New();
			try{c.func(0)}catch(e){cout(e)}
		},
		"pmc-class-argconst": function(env, cout, info){
			info.desc = "tests the argconst directive, validating arguments are not changed"
			info.exp = [
				"JEEP: The function 'Test.func' modified its arguments (arg.0,arg.1) despite declaring them constant.",
				];
			info.aspects = "class, function directive";
			let Class = env.CreateClassDef("Test", {
				PMC: "pmc-argconst",
				PUBLIC: {
					dummyvar: 0,
					func__argconst: function(f, g){f.val = 10, g.x = 0}
				}
			});
			let c = Class.New();
			try{c.func({val: 1}, {})}catch(e){cout(e)}
		},
		"pmc-class-argtype": function(env, cout, info){
			info.desc = "tests the argtype directive, validating arguments type"
			info.exp = ["JEEP: The function 'Test.func' was invoked with wrong argument types 'n(number,*string),s(string,*array),a(array,*object),ob(object,*number)'."];
			info.aspects = "class, function directive";
			let Class = env.CreateClassDef("Test", {
				PMC: "pmc-argtype",
				PUBLIC: {
					dummyvar: 0,
					func__argtype: function(n__number, s__string, a__array, ob__object){
						return function(n,s,a,ob){
						}
					}
				}
			});
			let c = Class.New();
			try{c.func("1",[1,2],{c:1},1);}catch(e){cout(e)}
		},
		"pmc-class-argtype-count": function(env, cout, info){
			info.desc = "invokes argtype function with wrong argument count"
			info.exp = ["JEEP: The function 'Test.func' was invoked with wrong argument count (declared: 4, given: 2)."];
			info.aspects = "class, function directive";
			let Class = env.CreateClassDef("Test", {
				PMC: "pmc-argtype",
				PUBLIC: {
					dummyvar: 0,
					func__argtype: function(n__number, s__string, a__array, ob__object){
						return function(n,s,a,ob){
						}
					}
				}
			});
			let c = Class.New();
			try{c.func(1,"1");}catch(e){cout(e)}
		},
		"pmc-class-argtype-type": function(env, cout, info){
			info.desc = "invokes argtype function with non typedef'd argument"
			info.exp = ["JEEP: The function 'Test.func' was invoked with wrong argument types 'n(Rec,*number)'."]
			info.aspects = "class, function directive";
			env.RegisterRecordDef("Rec", {val: 0})
			let Class = env.CreateClassDef("Test", {
				PMC: "pmc-argtype",
				PUBLIC: {
					dummyvar: 0,
					func__argtype: function(n__Rec){
						return function(n){
						}
					}
				}
			});
			let c = Class.New();
			try{c.func(1);}catch(e){cout(e)}
		},
		"pmc-class-argtype-unreg-type": function(env, cout, info){
			info.desc = "invokes argtype function with non typedef'd argument"
			info.exp = ["JEEP: The argument type 'Info' for the function 'Test.func' is unregistered."]
			info.aspects = "class, function directive";
			let Class = env.CreateClassDef("Test", {
				PMC: "pmc-argtype",
				PUBLIC: {
					dummyvar: 0,
					func__argtype: function(n__Info){
						return function(n){
						}
					}
				}
			});
			let c = Class.New();
			try{c.func(c);}catch(e){cout(e)}
		},	
		"pmc-group-access": function(env, cout, info){
			info.desc = "tests class access restriction";
			info.exp = [
				"pubval: 1", "privval: 3", 
				"privval: 4",
				"JEEP: Attempt to write private variable 'Test.privval' detected.",
				];
			info.aspects = "group, access";
			let grp = {};
			let Class = env.CreateGroup(grp, "Test", {
				PMC: "pmc-memaccess",
				PUBLIC: {
					pubval: 1,
					pubprint: function(f){
						cout("pubval:",this.pubval);
						this.pubprint2();
						f(this);
					},
					pubprint2: function(){
						this.privprint();
					}
				},
				PRIVATE: {
					privval: 3,
					privprint: function(){
						cout("privval:",this.privval)
					}
				}
			});
			grp.pubprint(function(c){
				grp.privval++; 
				grp.privprint()
			});
			try{grp.privval = 10;}catch(e){cout(e)}
		},
	},
	utils: {
		"utils-layout": function(env, cout, info){
			info.desc = "checks the names of all available utils";
			info.exp = ["CopyProps,SplitTrim,MakeFlags,RecursiveFlag,ObjectIterator,FlagProcessor,MessageFormatter"],
			info.aspects = "utils";
			cout(Object.keys(JEEP.Utils).join(','))
		},
		"utils-copyprops": function(env, cout, info){
			info.desc = "tests CopyProps";
			info.exp = [
			"a 1", "b 2", "c 3",
			"a 1", "b 2",
			"a -1", "b 2",
			],
			info.aspects = "utils";
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
		"utils-splittrim": function(env, cout, info){
			info.desc = "tests SplitTrim";
			info.exp = ["input: \" first, second,  third  \"", "output: \"first,second,third\""],
			info.aspects = "utils";
			let text = " first, second,  third  ";
			let st = JEEP.Utils.SplitTrim(text, ',')
			// cout with concat to avoid spurious spaces
			cout("input: \"" + text + "\"")
			cout("output: \""+st.join() +"\"");
		},
		"utils-makeflags": function(env, cout, info){
			info.desc = "tests MakeFlags";
			info.exp = ["first 1", "second 2", "third 4"],
			info.aspects = "utils";
			let flags = JEEP.Utils.MakeFlags("test", "first, second, third")
			let keys = Object.keys(flags)
			for(let k = 0; k<keys.length; k++)
				cout(keys[k], flags[keys[k]])
		},
		"utils-makeflags-over-32": function(env, cout, info){
			info.desc = "tests MakeFlags";
			if(env.IsDevMode())
				info.exp = ["JEEP WARNING: Generating 32 or more flags (Test) might cause overflow on your machine."];
			else
				info.exp = ["ok"];
			info.aspects = "utils";
			let fnames = "";
			for(let k = 0; k<33; k++)
				fnames += "f"+k+","
			JEEP.Utils.MakeFlags("Test", fnames, env)
			if(!env.IsDevMode())cout("ok")
		},
		"utils-makeflags-dupnames": function(env, cout, info){
			info.desc = "tests MakeFlags";
			if(env.IsDevMode())
				info.exp = ["JEEP: The flag 'Test' has repeated flag names 'f,g'."];
			else
				info.exp = ["ok"];
			info.aspects = "utils";
			try{JEEP.Utils.MakeFlags("Test", "f,g,f,g,f", env)}catch(e){cout(e)}
			if(!env.IsDevMode())cout("ok")
		},
		"utils-recursiveflag": function(env, cout, info){
			info.desc = "tests RecursiveFlag";
			info.exp = ["not set", "set", "not set", "not set", "not set", "set"],
			info.aspects = "utils";
			let rf = JEEP.Utils.RecursiveFlag.New();
			cout(rf.isSet()?"set":"not set")
			rf.add();
			cout(rf.isSet()?"set":"not set")
			rf.remove();
			cout(rf.isSet()?"set":"not set")
			// test that removing more times than added should not need as many times adding to be set
			rf.remove();
			cout(rf.isSet()?"set":"not set")
			rf.remove();
			cout(rf.isSet()?"set":"not set")
			rf.add();
			cout(rf.isSet()?"set":"not set")
		},
		"utils-objectiterator": function(env, cout, info){
			info.desc = "tests RecursiveFlag";
			info.exp = [
			"total: 0",
			"total: 5",
			"a 1", "b 2", "c 4", "d 8", "e 16",
			"a 0",
			"total: 0",
			"undefined undefined",
			"total: 0",
			"undefined undefined",
			],
			info.aspects = "utils";

			// empty object
			let iter = JEEP.Utils.ObjectIterator.New({})
			cout("total:", iter.Total())

			// valid object
			iter.Reset(JEEP.Utils.MakeFlags("","a,b,c,d,e"))
			cout("total:", iter.Total())
			while(iter.GetNext()){
				let pair = iter.GetCurrPair();
				cout(pair.key,pair.value)
			}

			// direct access after reset
			iter.Reset({a: 0, b: 1})
			cout(iter.GetCurrKey(), iter.GetCurrValue())

			// undefined object
			iter.Reset();
			cout("total:", iter.Total())
			cout(iter.GetCurrKey()||"undefined", iter.GetCurrValue()||"undefined")
			while(iter.GetNext()){
				let pair = iter.GetCurrPair();
				cout("pair",pair.key,pair.value)
			}

			// non object
			iter.Reset(100);
			cout("total:", iter.Total())
			cout(iter.GetCurrKey()||"undefined", iter.GetCurrValue()||"undefined")
			while(iter.GetNext()){
				let pair = iter.GetCurrPair();
				cout("pair",pair.key,pair.value)
			}
		},
		"utils-flagprocessor": function(env, cout, info){
			info.desc = "tests FlagProcessor";
			info.exp = [
			"3",
			"fifth,sixth",
			"null",
			"fifth,sixth",
			"null",
			],
			info.aspects = "utils";

			let fp = JEEP.Utils.FlagProcessor.New({
				first: 1,
				second: 2,
				third: 4
			})
			let res = fp.Process({flags: "first, second"})
			cout(res.flags)

			res = fp.Process({flags: "first, second, fifth, sixth", markError: true})
			cout(res.errors.join(','))

			res = fp.Process({flags: "first, second", singleOnly: true})
			cout(res==null?"null":"not null")

			res = fp.Process({flags: "fifth, sixth", markError: true, singleOnly: true})
			cout(res.errors.join(','))

			res = fp.Process({flags: "first, second, fifth, sixth", markError: true, singleOnly: true})
			cout(res==null?"null":"not null")
		},
		"utils-messageformatter": function(env, cout, info){
			info.desc = "tests MessageFormatter";
			info.exp = [
			"Testing $dollar$ 1,2,3.",
			"Hello. My name is Bond, James Bond.",
			"$ means dollar",			
			"null",
			],
			info.aspects = "utils";

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
			    "first-name": "James",
			    "last-name": "Bond"
			})
			cout(m);
			    
			m = MF.Get("dollar", {
			    how: "good",
			    what: "World",
			})
			cout(m);	

			m = MF.Get("invalid", {})		    
			cout(m==null?"null":"not null")
		},
	},

	/**** test mechanism implementation ****/

	Run: function(parentDiv){
		Tester.Init();
		JEEP.InitFramework();
		JEEP.impl.testing = true;

		let allTests = this.getTests();

		let passCount = 0;
		let failedTests = [];
		let devRunTime = 0, prodRunTime = 0;

		let header = JEEPTESTUTILS.CreateDiv({text: "Testing JEEP (refactored JEEP)"})
		header.style.fontWeight = "bold";
		document.body.insertBefore(header, document.body.firstChild);

		let envarr = [
			{mode: "devmode", env: JEEP.CreateEnvironment({mode: "development-mode", client: "jeep-aware"}), time: 0, tests: 0},
			{mode: "prodmode", env: JEEP.CreateEnvironment({mode: "production-mode", client: "jeep-aware"}), time: 0, tests: 0}
		]
		let counter = 1;

		for(let k = 0; k<allTests.tests.length; k++){
			let t = allTests.tests[k];
			let name = t.name;
			for(let q = 0; q <envarr.length; q++){
				let er = envarr[q];
				if(t.prodonly && (er.mode != "prodmode"))
					continue;

				JEEP.impl.clearForTest();

				t.name = "["+er.mode+"]"+name;
				console.log("running: "+counter+" " + t.name);
				let r = this.runTest(t, er.env);
				let res = r.res;
				er.time += r.time;
				er.tests++;

				parentDiv.appendChild(res.div)
				res.div.textContent = (counter)+": "+res.div.textContent;
				++counter;

				if(!res.status && r.ex){
					let div = JEEPTESTUTILS.CreateDiv({
						style: {fontSize: "14px", fontStyle: "italic"}
					});
					div.style.color = "black";
					div.style.margin = 0;
					div.textContent = r.ex;	
					res.div.insertBefore(div, res.div.firstChild);	
					res.status = false;
				}	

				if(res.status)
					passCount++;
				else {
					res.div.style.color = "red";
					failedTests.push({name: t.name, id: res.div.id});
				}				
			}
		}
		console.log("total tests run: " + (counter-1))

		let text = "";
		let totalTests = 0;
		for(let q = 0; q <envarr.length; q++)
			totalTests += envarr[q].tests;

		let totalPassTests = allTests.passTestCount*2 - allTests.pmcTestCount;
		let totalFailTests = allTests.failTestCount*2;
		if(failedTests.length == 0)
			text += "All tests (" + totalTests + ") PASSED" + " (passing-tests: " +totalPassTests+ " failing-tests: " +totalFailTests+ ")\n";
		else
			text += "Total tests: " + totalTests + " (passing-tests: " +totalPassTests+ " failing-tests: " +totalFailTests+ ")" + " Passed: " + passCount + " Failed: " + failedTests.length + "\n";

		let resdiv = JEEPTESTUTILS.CreateResultDiv({add: true, text: text});
		if(failedTests.length > 0)
			Tester.CreateFailList(failedTests, true);// add navigation

		text = "Some rough time estimates (in milliseconds)\n";
		let table = [];
		for(let q = 0; q <envarr.length; q++){
			let er = envarr[q];
			table.push({
					text: (er.tests)+" " +er.mode+" tests ran in",
					value: envarr[q].time.toFixed(3)
				})
		}
		text += JEEPTESTUTILS.GetFormattedText({
			arr: table,
			symCount: 5,
			sym: ".",
		});
		let time = JEEPTESTUTILS.CreateDiv({add: true, text: text});
		time.style.margin = "1em 0"
		resdiv.appendChild(time);

		let asp = Tester.CreateAspectsBrowser(parentDiv);
		if(asp)
			document.body.append(asp);
		
		JEEPTESTUTILS.CreateTimeStamp();
	},
	runTest: function(test, env){
		let tcase = Tester.NewCase();
		tcase.name = test.name;
		let cout = function(){
			tcase.AddGenerated(Array.prototype.slice.call(arguments).join(' '))
		}
		let old = JEEP.SetStdErr(cout);// do this to le syntax errors be tested with same mechanism as others
		let ex = null;
		let x = 0;
		try{
			x = performance.now();
			test.func(env, cout, tcase);
			x = performance.now()-x;
		}
		catch(e){
			ex = "EXCEPTION: " + (e.message ? e.message + " (ln:" + e.lineNumber + ")" : e);
		}
		JEEP.SetStdErr(old);
		return {time: x, ex: ex, res: tcase.Run()};
	},
	getTests: function(){
		let tests = [];
		let res = null;

		res = this.getTestFrom(this.passTests);
		this.prefixName(res, "[passing] ");
		tests = tests.concat(res);
		let passTestCount = res.length;
		console.log("total passing tests: " + res.length)

		res = this.getTestFrom(this.failTests);
		this.prefixName(res, "[failing] ");
		let failTestCount = res.length;
		tests = tests.concat(res);
		console.log("total failing tests: " + res.length)

		res = this.getTestFrom(this.pmcTests);
		for(let k = 0; k<res.length; k++)
			res[k].prodonly = true;
		this.prefixName(res, "[passing] ");
		passTestCount += res.length;
		let pmcTestCount = res.length;
		tests = tests.concat(res);
		console.log("total pmc tests: " + res.length)

		res = this.getTestFrom(this.utils);
		tests = tests.concat(res);
		passTestCount += res.length;

		return { tests: tests, passTestCount: passTestCount, failTestCount: failTestCount, pmcTestCount: pmcTestCount};
	},
	prefixName: function(arr, pref){
		for(let k = 0; k<arr.length; k++)
			arr[k].name = pref + arr[k].name;
	},
	getTestFrom: function(where){
		let tests = [];
		let keys = Object.keys(where);
		for(let k = 0; k<keys.length; k++){
			let tf = where[keys[k]];
			tests.push({name: keys[k], func: tf});
		}
		return tests
	},
}