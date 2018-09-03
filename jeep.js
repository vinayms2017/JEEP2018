/* 2018 August
 --------------------------------------------------------------------
 Designed and Developed by Vinay.M.S
 --------------------------------------------------------------------
 
 JEEP is a C++ inspired framework that brings to robustness JavaScript toenable software engineering.
 There are far too many features to list here, so highlighting only eight most attractive ones.

 Qualitative
 	* robustness
 	* maintainable and extensible classes
 	* intuitive class description
 	* improved productivity and performance

 Technical
 	* multiple inheritance
 	* virtual and abstract functions
  	* public, protected and private members
	* development and production mode split

 --------------------------------------------------------------------
 This class is usable subject to MIT license.
 --------------------------------------------------------------------
 The MIT License (MIT) http://opensource.org/licenses/MIT
 
 Copyright (c) 2018 Vinay.M.S
 
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

/*
TODO: (star means in no particular order)
1. optimize object layout by adding functions to prototype so that instantiation will be fast for class and struct
2. class constructor directives other than managed, esp arg related ones
3. descriptive error messages like Jeep2017
4. *add more devmode checks in implementation (I have a hunch its incomplete)
5. *extend structure
6. *dynamic cast class
7. *more refactoring with better names
*/

JEEP = {
	Utils: {},
	InitFramework: function(){
		this.impl.fx = this;
		this.impl.init(this.Utils)
	},
	// printer = function(c){}
	SetStdErr: function(printer){
		let old = this.impl.stderr;
		this.impl.stderr = printer;
		return old;
	},
	// info = {mode, client, flags}
	CreateEnvironment: function(info){
		let fx = this;
		let impl = this.impl;

		let badProps = impl.validateProps(info, "mode, client, flags");
		if(badProps)
			impl.abort("invalid-props", {api: "CreateEnvironment", props: badProps.join(',')})
		if(!info.mode || !info.client)
			impl.abort("invalid-env-desc", {})
		if(info.mode != "development-mode" && info.mode != "production-mode")
			impl.abort("invalid-env-prop", {prop: "mode", propval: info.mode})
		if(info.client != "jeep-aware" && info.client != "jeep-agnostic")
			impl.abort("invalid-env-prop", {prop: "client", propval: info.client})
		let procres = null;
		if(info.flags){
			procres = impl.envFlagProc.Process({markError: true, flags: info.flags});
			if(procres.errors.length > 0)
				impl.abort("invalid-env-prop", {prop: "flags", propval: info.flags})
		}
		let shared = {internal: false};// a hack to reuse code
		let env = {
			IsDevMode: function(){return "development-mode" == info.mode},
			IsClientJeepAware: function(){return "jeep-aware" == info.clientType},
			CreateRecordDef: function(name, def){
				impl.validateName(this, "record", name, shared.internal);
				return impl.createRecStructDef("CreateRecordDef", this, name, def, true);
			},
			RegisterRecordDef: function(name, def){
				impl.validateName(this, "record", name, shared.internal);
				impl.validateRegister(this, "record", name, shared.internal);
				let rec = impl.createRecStructDef("RegisterRecordDef", this, name, def, true)
				impl.defstore[name] = impl.objRecord.InitNew({def: rec, type: impl.objFlags.record});
			},
			CreateStructDef: function(name, def){
				impl.validateName(this, "struct", name, shared.internal);
				return impl.createRecStructDef("CreateStructDef", this, name, def, false);
			},
			RegisterStructDef: function(name, def){
				impl.validateName(this, "struct", name, shared.internal);
				impl.validateRegister(this, "struct", name, shared.internal);
				let rec = impl.createRecStructDef("RegisterStructDef", this, name, def, false);
				impl.defstore[name] = impl.objRecord.InitNew({def: rec, type: impl.objFlags.struct});
			},
			CreateClassDef: function(name, def){
				impl.validateName(this, "class", name, shared.internal);
				return impl.processClassDef("CreateClassDef", name, def, env);
			},
			RegisterClassDef: function(name, def){
				impl.validateRegister(this, "class", name, shared.internal);
				let d = impl.processClassDef("RegisterClassDef", name, def, env);
				impl.defstore[name] = impl.objRecord.InitNew({def: d, type: impl.objFlags.class});
			},
			CreateClassWrapper: function(classname, def){
				return impl.createClassWrapper(this, classname, def);
			},
			CreateField: function(where, name, def){
				impl.createField(env, where, name, def);
			},
			RegisterField: function(name, def){
				let where = {};
				impl.createField(env, where, name, def);
				impl.defstore[name] = impl.objRecord.InitNew({def:where, type: impl.objFlags.field});
			},
			CreateGroup: function(where, name, def){
				impl.createGroup("CreateGroup", where, name, def, env);
			},
			RegisterGroup: function(name, def){
				let where = {};
				impl.createGroup("RegisterGroup", where, name, def, env);
				// InitNew always clones objects. If the group is in produnction mode, the variable are
				// added to 'where', and cloning would be detremental because the group Init works on the 
				// original object while the other functions work on the cloned one. So, add the 'where' 
				// separately.
				let rec = impl.objRecord.InitNew({type: impl.objFlags.group});
				rec.def = where;
				impl.defstore[name] = rec;
			},
			CreateNamespace: function(){
				let env = this;
				let pref = ".ns"+(impl.namespaceCounter++)+".";
				let Namespace = {
					GetEnvironment: function(){return env},
					Partition: function(names){
						impl.partitionNamespace(env, names, this);
					},
					Flatten: function(){
						if(!this.$) return null;
						let errors = [], flatobj = {};
						impl.flattenNamespace(env, this.$, flatobj, errors);
						if(errors.length > 0)
							impl.abort("namespace-flatten-duplicate", {names: errors.join(',')})
						return flatobj;
					},
				}
				let fxapi = ["ObjectDefExists", "GetObjectDef"];
				for(let k = 0; k<fxapi.length; k++){
					Namespace[fxapi[k]] = function(name){
						return fx[fxapi[k]](pref+name)
					}
				}
				let envapi = ["RegisterRecordDef", "RegisterStructDef", "RegisterClassDef", "RegisterField", "RegisterGroup"]
				for(let k = 0; k<envapi.length; k++){
					Namespace[envapi[k]] = function(name, def){
						shared.internal = true;
						let ex = null;
						try{env[envapi[k]](pref+name, def)}catch(e){ex=e}
						shared.internal = false;
						if(ex) throw ex;
					}
				}
				return Namespace;
			},
			GetLibrary: function(name){
				return impl.getLibrary.apply({impl: impl, env: this},arguments);
			},
			impl: {
				getFlags: function(){return procres ? procres.flags : 0},
			}
		}
		return env;
	},
	ObjectDefExists: function(name){
		return null !== this.impl.getDef(name, true)// nothrow
	},
	GetObjectDef: function(name){
		return this.impl.getDef(name)
	},
	Typedef: function(newtype, existing){
		this.impl.typeDef(newtype, existing);
	},
	RegisterLibrary: function(name, initFunc){
		// To allow using this without having to remember to initialte the framework internally.
		// Since initialization is idempotent, this causes no problem and makes JEEP user friendly.
		this.InitFramework();
		this.impl.registerLibrary(name, initFunc);
	},
	RegisterLibraryBuilder: function(name, libname, initFunc){
		// To allow using this without having to remember to initialte the framework internally.
		// Since initialization is idempotent, this causes no problem and makes JEEP user friendly.
		this.InitFramework();
		this.impl.registerLibraryBuilder(name, libname, initFunc);
	},
	Equal: function(a, b){
		return this.impl.equal(a,b, true);
	},
	ValEqual: function(a, b){
		return this.impl.equal(a,b, false);
	},
	impl: {
		//----------------------------------------
		// record & structure
		//----------------------------------------
		createRecStructDef: function(api, env, name, def, isRec){
			let devmode = !env || env.IsDevMode();
			let instname = name.substring(name.lastIndexOf('.')+1);
			if(devmode){
				let props = isRec ? "CONSTRUCTOR, DESTRUCTOR, PMC, PUBLIC, PROTECTED, PRIVATE, STATIC" : "DESTRUCTOR, EXTENDS, PUBLIC, PROTECTED, PRIVATE, STATIC";
				let badProps = this.validateProps(def, props, true)
				if(badProps)
					this.abort("invalid-props", {api: api, props: badProps.join(',')})
			}
			let res = this.splitVarFunc(def);
			if(devmode && !res.vars)
				this.addSyntaxError("recstruct-novars", {name: instname, type: (isRec?"record":"struct")})
			if(devmode && !isRec && !res.funcs)
				this.addSyntaxError("struct-nofuncs", {name: instname})
			if(isRec){
				if(res.vars && res.vars.EXTENDS){
					let vars = this.getExtendedRecordVars(env, instname, def.EXTENDS, res.vars);// this also validates if devmode
					if(vars)
						this.merge(vars, res.vars);
				}
				this.merge(res.funcs, res.vars);// for record everything is 'variable'
			}
			// record ends at this point, so try to abort if needed
			if(devmode && isRec)
				this.abortOnSyntaxError("record", instname);

			let impl = this;
			let RecStruct = {};
			let jdef = this.createJeepDef({type: isRec?"record":"struct", name: name, desc: def, defobj: RecStruct});
			RecStruct._jeepdef_ = jdef;

			if(isRec){
				jdef.vars = res.vars;
			}
			else {
				if(res.vars)
					jdef.vars = this.undecorateVars("struct", env, res.vars);
				if(res.funcs){
					let ctorInfo = this.getCtor("struct", env, res.funcs);
					if(ctorInfo){
						jdef.ctor = ctorInfo.ctor
						delete res.funcs[ctorInfo.name];// let it not be added to the instance
						if(devmode && (ctorInfo.undec.decflags != 0))
							this.addSyntaxError("struct-ctor-directives", {})
					}
					jdef.funcs = this.undecorateFuncs("struct", env, res.funcs);
				}
				let pmc = this.getPMCFlags(env, def.PMC, this.fxFlags.pmc_memaccess);
				if(devmode || (pmc & this.fxFlags.pmc_memaccess))
					jdef.priv = this.restrictedMembersExist(jdef.funcs) || this.restrictedMembersExist(jdef.vars);
			}
			// struct definition validation ends here, check before proceeding
			this.abortOnSyntaxError("struct", instname);

			let commonAccess = this.createRecursiveFlag();

			RecStruct.New =  function(){
				if(arguments.length > 0 && !jdef.ctor)// both record and struct without ctor
					impl.abort("new-noctor", {name: instname, type: isRec?"record":"struct"})
				let inst = {};
				let access = impl.instRecStruct(env, commonAccess, instname, inst, RecStruct, isRec);
				if(jdef.ctor){
					if(access) access.add();
					commonAccess.add();
					jdef.ctor.apply(inst, arguments);
					if(access) access.remove();
					commonAccess.remove();
				}
				Object.seal(inst);
				return inst;
			},				
			RecStruct.InitNew = function(vars){
				if((!env || env.IsDevMode())){
					if(arguments.length === 0)
						impl.abort("initnew-noargs", {name: instname, type: isRec?"record":"struct"})
					if(arguments.length !== 1)
						impl.abort("initnew-moreargs", {name: instname, type: isRec?"record":"struct"})
				}
				let inst = {};
				let access = impl.instRecStruct(env, commonAccess, instname, inst, RecStruct, isRec, vars);
				if(jdef.ctor){
					if(access) access.add();
					commonAccess.add();
					inst.$initnew = true;
					jdef.ctor.apply(inst);
					delete inst.$initnew;
					if(access) access.remove();
					commonAccess.remove();
				}
				Object.seal(inst);
				return inst;
			},
			RecStruct.InstanceOf =  function(inst){
				return inst.$def == RecStruct;
			}
			return RecStruct;
		},
		getExtendedRecordVars: function(env, name, ext, ref){
			let devmode = !env || env.IsDevMode();
			let vars = {}, dupnames = [], badExt = false;
			for(let i = 0; i<ext.length; i++){
				let e = ext[i];
				let btype = typeof e;
				if(btype !== "string"){
					if(btype !== "object" || e._jeepdef_ === undefined){
						badExt = true;// mark here, add the error at the end
						continue;
					}
					brec = e;
				}			
				else
					brec = this.getDef(e, true);// nothrow
				if(brec === null){
					if(devmode)
						this.addSyntaxError("rec-extends-nodef", {name: e})					
					continue;
				}
				let keys = Object.keys(brec._jeepdef_.vars);
				for(let j = 0; j<keys.length; j++){
					let ky = keys[j];
					let v = brec._jeepdef_.vars[ky];
					if(!devmode)
						vars[ky] = v
					else{
						if(vars[ky] === undefined && ref[ky] === undefined)
							vars[ky] = v
						else 
							dupnames.push({bname: brec.$name, vname: ky})
					}
				}
			}
			if(devmode) {
				if(badExt)
					this.addSyntaxError("rec-extends-badarg", {})
				for(let k = 0; k<dupnames.length; k++)
					this.addSyntaxError("rec-extends-dupnames", dupnames[k])
			}
			return dupnames.length > 0 ? null : vars;
		}, 
		instRecStruct: function(env, commonAccess, name, inst, defobj, isRec, vars){
			let def = defobj._jeepdef_;
			let varkeys = null;
			if(vars){
				if(!env || !env.IsDevMode())
					varkeys = Object.keys(vars)
				else {
					let errors = [];
					varkeys = this.testInitNew(env, vars, def.vars, errors)
					if(errors.length > 0)
						this.abort("initnew-fail", {name: name, type: (isRec?"record":"struct"), errnames: errors.join(',')})
				}
			}
			inst.$name = name;
			inst.$def = defobj;
			inst._jeepdef_ = def;
			let access = null;
			this.addRecStructInstVariables(true, inst, def.vars, isRec);
			if(vars)
				this.addRecStructInstVariables(false, inst, vars, isRec, varkeys);
			if(!isRec)
				access = this.addStructMembers(inst, commonAccess, def);
			return access;
		},
		addRecStructInstVariables: function(def, inst, varref, isRec, varkeys){
			let keys = varkeys || Object.keys(varref);
			if(isRec){
				for(let k = 0; k<keys.length; k++)
					inst[keys[k]] = this.cloneVariable(varref[keys[k]])
			}
			else{
				for(let k = 0; k<keys.length; k++){
					let v = varref[keys[k]];
					inst[keys[k]] = this.cloneVariable(def ? v.item : v)
				}
			}
		},
		makeStructMemFunc: function(inst, func, access, commonAccess){
			return function(){
				access.add();
				commonAccess.add();
				let r = null, ex = null;
				try{r = func.apply(inst, arguments)}
				catch(e){ex = e}
				access.remove();
				commonAccess.remove();
				if(ex) throw ex;
				return r;
			}
		},
		addStructMembers: function(inst, commonAccess, def){
			let access = this.createRecursiveFlag();
			let impl = this;
			if(!def.priv){
				let keys = Object.keys(def.funcs);
				for(let k = 0; k<keys.length; k++)
					inst[keys[k]] = def.funcs[keys[k]].item;					
			}
			else {
				let items = {};
				this.merge(def.funcs, items)
				this.merge(def.vars, items)
				let keys = Object.keys(items);
				for(let k = 0; k<keys.length; k++){
					let rec = items[keys[k]];
					let ky = keys[k];
					let type = typeof rec.item;
					rec = this.cloneObject(rec);// because item will be modified
					let name = inst.$name+"."+ky;
					if(type == "function"){
						let func = rec.item;
						rec.item = this.makeStructMemFunc(inst, func, access, commonAccess);
					}
					access.obj[ky] = rec.item;
					let priv = rec.decflags & this.fxFlags.private;
					Object.defineProperty(inst, ky, {
						configurable: false,
						enumerable: true,
						get: function(){
							if(!commonAccess.isSet() && priv && !access.isSet())
								impl.abort("restricted-access", {access: type == "function" ? "access" : "read", spectype: "private", memtype: type == "function" ? "function" : "variable", name: name})
							return access.obj[ky]
						},
						set: function(v){
							if(!commonAccess.isSet() && priv && !access.isSet())
								impl.abort("restricted-access", {access: "write", spectype: "private", memtype: type == "function" ? "function" : "variable", name: name})
							access.obj[ky] = v;
						},
					});
				}
			}
			return access;
		},
		//----------------------------------------
		// class
		//----------------------------------------
		validateClassProps: function(api, env, def, obj){
			if(!env.IsDevMode())
				return;
			let props = ""
			switch(obj){
				case "class": props = "CONSTRUCTOR, DESTRUCTOR, EXTENDS, PMC, PUBLIC, PROTECTED, PRIVATE, STATIC"; break;
				case "group": props = "CONSTRUCTOR, PMC, PUBLIC, PROTECTED, PRIVATE"; break;
			}
			let badProps = this.validateProps(def, props);
			if(badProps){
				let ctor = null;
				for(let k = 0; k<badProps.length; k++){
					ctor  = this.getCtor(null, env, def)
					if(ctor) break;
				}
				if(!ctor)
					this.abort("invalid-props", {api: api, props: badProps.join(',')})
			}
		},
		processClassDef: function(api, name, def, env){
			name = name.substring(name.lastIndexOf('.')+1);
			let gcres = this.generateClass(api, name, def, env, "class");
			let Class = gcres.Class;
			let classDef = Class.prototype._jeepdef_;
			let validate = env.IsDevMode();
			let flatBaseDefs = null;
			if(classDef.bases){
				flatBaseDefs = [];
				this.flattenBaseDefTree(classDef, flatBaseDefs);
				classDef.flatBaseDefs = flatBaseDefs;
			}
			if(validate){
				this.preValidateClassDef(classDef);
			}
			this.finalizeClassDef(env, gcres, flatBaseDefs);
			if(validate)
				this.postValidateClassDef(classDef);
			this.abortOnSyntaxError("class", name);
			return Class;
		},
		generateClass: function(api, name, def, env, piggy){
			let devmode = env.IsDevMode();
			this.validateClassProps(api, env, def, piggy||"class")
			let vars = {public: null, protected: null, private: null}, 
				funcs = {public: null, protected: null, private: null};			
			let res = {vars: {}, funcs: {}};
			let virtualFuncs = {};
			let staticMembers = {};
			if(def.PROTECTED){
				res = this.splitVarFunc(def.PROTECTED);
				vars.protected = this.undecorateVars(piggy, env, res.vars, name, this.fxFlags.protected);
				funcs.protected = this.undecorateFuncs(piggy, env, res.funcs, name, this.fxFlags.protected);
				this.getVFuncs(virtualFuncs, funcs.protected);
			}
			if(def.PRIVATE){
				res = this.splitVarFunc(def.PRIVATE);
				vars.private = this.undecorateVars(piggy, env, res.vars, name, this.fxFlags.private);
				funcs.private = this.undecorateFuncs(piggy, env, res.funcs, name, this.fxFlags.private);
				this.getVFuncs(virtualFuncs, funcs.private);
			}
			if(def.PUBLIC){
				res = this.splitVarFunc(def.PUBLIC);
				vars.public = this.undecorateVars(piggy, env, res.vars, name, this.fxFlags.public);
				res.funcs = res.funcs || {};
				let reffuncs = {};
				if(devmode){
					this.merge(funcs.public, reffuncs)
					this.merge(funcs.protected, reffuncs);
					this.merge(funcs.private, reffuncs)
				}
				this.addGetSetFuncs(env, vars.protected, reffuncs, res.funcs);
				this.addGetSetFuncs(env, vars.private, reffuncs, res.funcs);
				this.addGetSetFuncs(env, vars.public, reffuncs, res.funcs);
				funcs.public = this.undecorateFuncs(piggy, env, res.funcs, name, this.fxFlags.public);
				this.getVFuncs(virtualFuncs, funcs.public);
			}
			if(def.STATIC){
				res = this.splitVarFunc(def.STATIC);
				let statVars = this.undecorateVars("static-variable", env, res.vars, name, this.fxFlags.static);
				let statFuncs = this.undecorateFuncs("static-function", env, res.funcs, name, this.fxFlags.static);
				// let svar = {};
				// let keys = Object.keys(statVars);
				// for(let k = 0; k<keys.length; k++){
				// 	let ky = keys[k];
				// 	let rec = statVars[ky]
				// 	if(rec.decflags & (this.fxFlags.public|this.fxFlags.protected)){
				// 		let v = {}
				// 		svar[ky] = rec.item;
				// 		Object.defineProperty(v, ky, {
				// 			configurable: false,
				// 			enumerable: true,
				// 			set: function(v){svar[ky]=v},
				// 			get: function(v){return svar[ky]},
				// 		})
				// 		rec.item = v;
				// 	}
				// }
				this.merge(statVars, staticMembers)
				this.merge(statFuncs, staticMembers)
			}
			// check for managed constructor
			// NOTE: Although this involves a bit of validation, this can't be moved to the validating
			// helpers because they won't be called in production mode, which messes up the setting of
			// managed mechanism.
			let ctorInfo = this.getCtor("class", env, def);
			if(ctorInfo){
				if(piggy == "group"){
					if(devmode && ctorInfo.undec.decflags != 0)
						this.addSyntaxError("group-ctor-directives", {})
				}
				else {
					def.CONSTRUCTOR = ctorInfo.ctor
					let managed = (ctorInfo.undec.decflags & this.fxFlags.managed);
					if(managed && !def.DESTRUCTOR)					
						this.addSyntaxError("managed-dtor-absent", {})
					if(!managed && def.DESTRUCTOR)					
						this.addSyntaxError("managed-dtor-nomanage", {})
				}
			}
			return this.generateClassDef({name: name, desc: def, env: env, 
				vars: vars, funcs: funcs, flags: ctorInfo ? ctorInfo.undec.decflags : 0,
				vfuncs: Object.keys(virtualFuncs).length > 0 ? virtualFuncs : null,
				staticMembers: Object.keys(staticMembers).length > 0 ? staticMembers : null,
			})
		},
		getCtor: function(hint, env, def){
			let ctor = null;
			let temp = {};
			let keys = Object.keys(def);
			for(let k = 0; k<keys.length; k++){
				if(keys[k].indexOf("CONSTRUCTOR") >= 0){
					temp[keys[k]] = def[keys[k]];
					ctor = {name: keys[k], ctor: def[keys[k]], undec: null}
					break;
				}
			}
			if(!ctor) 
				return null;
			let undec = this.undecorate(hint, env, temp, "constructor");
			if(!undec)
				return null;
			undec = undec["CONSTRUCTOR"];// undecorate returns a map
			if(!undec)
				return null;
			ctor.undec = undec;
			return ctor;
		},
		preValidateClassDef: function(classDef){
			if(classDef.dtor && !classDef.ctor)
				this.addSyntaxError("dtor-no-ctor", {})
			if(classDef.flatBaseDefs){
				let err = "";
				for(let k = 0; k<classDef.flatBaseDefs.length; k++){
					let b = classDef.flatBaseDefs[k];
					if(b.flags & this.fxFlags.private)
						err += ","+b.$name;
				}
				if(err.length > 0)
					this.addSyntaxError("base-ctor-private", {bases: err.substring(1)})
			}
		},
		postValidateClassDef: function(classDef){
			if(Object.keys(classDef.vars).length == 0)
				this.addSyntaxError("class-group-empty", {type: "class", mem: "variables"})
			if((Object.keys(classDef.funcs).length == 0) && (!classDef.peVFuncs || (Object.keys(classDef.peVFuncs).length == 0)))
				this.addSyntaxError("class-group-empty", {type: "class", mem: "functions"})
		},
		markMembers: function(members, def, code){
			if(!def) return;
			let acc = ["public", "protected", "private"];
			for(let k = 0; k<acc.length; k++){
				let part = def[acc[k]];
				if(!part) continue;
				let keys = Object.keys(part);
				for(let j = 0; j<keys.length; j++){
					let r = members[keys[j]];
					if(!r){
						r = {acc: 0, type: 0};
						members[keys[j]] = r;
					}
					r.acc |= 1 << k;
					r.type |= code;
				}
			}
		},
		markMemberOccurance: function(loc, mem){		
			let keys = Object.keys(loc)
			for(let k = 0; k<keys.length; k++){
				let ky = keys[k];
				let rec = mem[ky];
				if(!rec){
					rec = []
					mem[ky] = rec;
				}
				let li = loc[ky]
				let p = li.$orig||li.$owner;
				if(rec.indexOf(p) < 0)
					rec.push(p)
			}
		},
		checkHierarchyDupnames: function(flatBases, classDef, part, type){
			let mem = {}
			for(let b = 0; b<flatBases.length; b++){
				let base = flatBases[b];
				this.markMemberOccurance(base[part], mem);
			}
			this.markMemberOccurance(classDef[part], mem);

			let keys = Object.keys(mem);
			for(let k = 0; k<keys.length; k++){
				let ky = keys[k];
				let r = mem[ky];
				if(r.length > 1){
					let names = "";
					for(let g = 0; g<r.length; g++)
						names += ","+r[g].$name
					this.addSyntaxError("hierarchy-dupname", {memtype: type, name: ky,  owners: names.substring(1)})
				}
			}
		},
		getVFuncs: function(virtualFuncs, funcs){
			if(!funcs)
				return;
			let iter = this.fx.Utils.ObjectIterator.New(funcs);
			while(iter.GetNext()){
				let pair = iter.GetCurrPair();
				if(pair.value.decflags & (this.fxFlags.virtual|this.fxFlags.abstract))
					virtualFuncs[pair.key] = pair.value;
			}
		},
		markVFuncSig: function(funcs, fmap){
			let keys = Object.keys(funcs);
			for(let k = 0; k<keys.length; k++){
				let ky = keys[k];
				let fi = funcs[ky];
				let vi = fmap[ky];
				if(vi === undefined)
					fmap[ky] = {args: fi.item.length, flags: fi.decflags};
				else {
					if(vi.args != fi.item.length)
						vi.args = -1;
					let f = vi.flags;
					if(f > 0){
						f &= ~(this.fxFlags.virtual|this.fxFlags.abstract);
						if(f != (fi.decflags & ~(this.fxFlags.virtual|this.fxFlags.abstract)))
							vi.flags = -1;
					}
				}
			}
		},
		// returns false to indicate all pevf were found
		getPEDVFuncs: function(classDef, allvf, out){
			if(classDef.vfuncs){
				let keys = Object.keys(allvf);
				let total = keys.length, found = 0;
				for(let k = 0; k<keys.length; k++){
					let afi = allvf[keys[k]];
					if(afi.found){
						found++;
						continue;
					}
					let fi = classDef.vfuncs[keys[k]];
					if(fi){
						// this logic is important to enable reabstraction
						if(!(fi.decflags & this.fxFlags.abstract))
							out[keys[k]] = fi;
						afi.found = true;
					}
				}
				return found < total;
			}
			return true;// always indicate more
		},
		getVFuncOrigin: function(fname, flatBaseDefs){
			let orig = [];
			for(let k = 0; k<flatBaseDefs.length; k++){
				let bd = flatBaseDefs[k];
				if(!bd.vfuncs) continue;
				let keys = Object.keys(bd.vfuncs);
				for(let j = 0; j<keys.length; j++){
					if(keys[j] === fname){
						let fi = bd.vfuncs[keys[j]]
						if(orig.indexOf(fi.$orig) < 0)
							orig.push(fi.$orig)
						break;
					}
				}
			}
			return (orig.length == 1) ? orig[0] : null;
		},
		mergeAccessGroups: function(env, classDef){			
			// first check for name clash between public, protected and private members
			if(env.IsDevMode()){
				let members = {};
				this.markMembers(members, classDef.vars, 2);
				this.markMembers(members, classDef.funcs, 1);
				let keys = Object.keys(members);
				for(let j = 0; j<keys.length; j++){
					let r = members[keys[j]];
					if(r.type == 3)
						this.addSyntaxError("member-varfunc", {name: keys[j]})
					else if(r.acc != 1 && r.acc != 2 && r.acc != 4)
						this.addSyntaxError("member-multiple-acc", {name: keys[j], type: r.type == 1 ? "function" : "variable"})
				}
			}
			// now merge
			let mf = {};
			this.merge(classDef.funcs.public, mf);
			this.merge(classDef.funcs.protected, mf);
			this.merge(classDef.funcs.private, mf);
			classDef.funcs = mf;
			let mv = {};
			this.merge(classDef.vars.public, mv);
			this.merge(classDef.vars.protected, mv);
			this.merge(classDef.vars.private, mv);
			classDef.vars = mv;
		},
		makeAutoName: function(prefix, name){
			return  prefix + name[0].toUpperCase() + name.substring(1);
		},
		addGetSetFuncs: function(env, vars, reffuncs, funcs){
			if(!vars) return;
			let devmode = env.IsDevMode();
			let vkeys = Object.keys(vars);
			for(let k = 0; k<vkeys.length; k++){
				let ky = vkeys[k];
				let vi = vars[ky]				
				if(vi.decflags & this.fxFlags.getter){
					let fname = this.makeAutoName("get", ky)
					if(devmode && reffuncs[fname] !== undefined)
						this.addSyntaxError("get-set-clash", {type: "get", vname: ky, fname: fname})
					else
						funcs[fname] = function(){return this[ky]}
				}
				if(vi.decflags & this.fxFlags.setter){
					let fname = this.makeAutoName("set", ky)
					if(devmode && vi.decflags & this.fxFlags.constant)
						this.addSyntaxError("set-var-const", {vname: ky, fname: fname})
					else {
						if(devmode && reffuncs[fname] !== undefined)
							this.addSyntaxError("get-set-clash", {type: "set", vname: ky, fname: fname})
						else
							funcs[fname] = function(v){this[ky] = v}
					}
				}
			}
		},
		setMemOO: function(env, def, mem){
			let devmode = env.IsDevMode();
			let keys = Object.keys(mem);
			for(let k = 0; k<keys.length; k++){
				let rec = mem[keys[k]];
				rec.$owner = def;
				if(devmode)
					rec.$orig = def;
			}
		},
		setMemberOwnerOrigin: function(env, classDef){
			this.setMemOO(env, classDef, classDef.vars);
			this.setMemOO(env, classDef, classDef.funcs);
		},
		finalizeClassDef: function(env, gcres, flatBaseDefs){
			let devmode = env.IsDevMode();

			let Class = gcres.Class;
			let classDef = Class.prototype._jeepdef_;

			this.mergeAccessGroups(env, classDef);
			this.setMemberOwnerOrigin(env, classDef);

			// do some hierarchy related management and manipulation
			if(flatBaseDefs){
				let bvfmap = {};
				let allvf = {};

				// get all virtual functions

				if(classDef.vfuncs){
					let iter = this.fx.Utils.ObjectIterator.New(classDef.vfuncs);
					while(iter.GetNext()){
						let pair = iter.GetCurrPair();
						if(devmode){
							let orig = this.getVFuncOrigin(pair.key, flatBaseDefs);
							if(orig)
								pair.value.$orig = orig;
						}
						allvf[pair.key] = {found: false, fi: pair.value}
					}
				}

				// validate the hierarchy, constructor managedness and virtual arguments before merging

				if(devmode){
					let vfuncsig = {};
					if(classDef.vfuncs)
						this.markVFuncSig(classDef.vfuncs, vfuncsig)
					this.checkHierarchyDupnames(flatBaseDefs, classDef, "vars", "variable")
					this.checkHierarchyDupnames(flatBaseDefs, classDef, "funcs", "function")
					for(let k = 0; k<flatBaseDefs.length; k++){
						let bd = flatBaseDefs[k];
						if(bd.vfuncs)
							this.markVFuncSig(bd.vfuncs, vfuncsig)
						if((bd.flags & this.fxFlags.managed) && classDef.ctor && !(classDef.flags & this.fxFlags.managed)){
							this.addSyntaxError("ctor-nomanage", {})
							break;
						}
					}
					let keys = Object.keys(vfuncsig);
					for(let k = 0; k<keys.length; k++){
						let ky = keys[k];
						let vi = vfuncsig[ky];
						if(vi.args < 0)
							this.addSyntaxError("vfunc-args", {fname: ky})
						if(vi.flags < 0)
							this.addSyntaxError("vfunc-directives", {fname: ky})
					}
				}
				
				let protctor = false;
				for(let k = 0; k<flatBaseDefs.length; k++){
					let bd = flatBaseDefs[k];
					protctor |= (bd.flags & this.fxFlags.protected);
					if(bd.vfuncs){
						bvfmap[bd.$name] = bd.vfuncs;
						let iter = this.fx.Utils.ObjectIterator.New(bd.vfuncs);
						while(iter.GetNext()){
							let pair = iter.GetCurrPair();
							allvf[pair.key] = {found: false, fi: pair.value}
						}
					}
					this.mergeBaseClass(bd, classDef, k+1);
					this.merge(bd.baseVFuncs, bvfmap);
					classDef.wrapperInits = classDef.wrapperInits.concat(bd.wrapperInits);
				}
				if(protctor && !classDef.ctor){
					classDef.flags |= this.fxFlags.protected;
					delete Class.New;
					delete Class.InitNew;
				}
				
				if(Object.keys(bvfmap).length > 0){
					classDef.baseVFuncs = bvfmap;

					// create the instBase object, if necessary, to help fast creationn of $base by doing 
					// here all the checking as to what items are necessary instead of doing it at runtime
					let base = {};
					let biter = this.fx.Utils.ObjectIterator.New(bvfmap);
					while(biter.GetNext()){
						let bpair = biter.GetCurrPair();
						let fmap = bpair.value;
						let fiter = this.fx.Utils.ObjectIterator.New(fmap);
						while(fiter.GetNext()){
							let fpair = fiter.GetCurrPair();
							if((fpair.value.memAccessFlag != this.fxFlags.private) && !(fpair.value.decflags & this.fxFlags.abstract) && classDef.funcs[fpair.key]){
								base[bpair.key] = base[bpair.key] || {};
								base[bpair.key][fpair.key] = fpair.value;
							}
						}
					}
					if(Object.keys(base).length > 0)
						classDef.instBase = base;
				}

				// Get polymorphism enabling virtual functions. These are basically the latest overrides
				// of the virtual functions. They can be at any base, so entire hierarchy must be searched.
				// Since they are supposed to be latest, start with leaf class and go backwards till root.
				// Similarly get the polymorphism disabling virtual functions, which are exact opposite in
				// all respects.

				let pevf = {};
				if(classDef.vfuncs)
					this.getPEDVFuncs(classDef, allvf, pevf);
				for(let k = flatBaseDefs.length-1; k>= 0; k--){
					if(!this.getPEDVFuncs(flatBaseDefs[k], allvf, pevf))// false returned to say all found
						break;
				}
				if(Object.keys(pevf).length > 0)
					classDef.peVFuncs = pevf;
				
				let akeys = Object.keys(allvf);
				for(let k = 0; k<akeys.length; k++)
					allvf[akeys[k]].found = false;

				let pdvf = {};
				for(let k = 0; k< flatBaseDefs.length; k++){
					if(!this.getPEDVFuncs(flatBaseDefs[k], allvf, pdvf))// false returned to say all found
						break;
				}
				if(classDef.vfuncs)
					this.getPEDVFuncs(classDef, allvf, pdvf);
				if(Object.keys(pdvf).length > 0)
					classDef.pdVFuncs = pdvf;

				// mark abstract names if any

				let absnames = "";
				let iter = this.fx.Utils.ObjectIterator.New(allvf);
				while(iter.GetNext()){
					let pair = iter.GetCurrPair();
					let pvfi = pevf[pair.key];
					if((pair.value.fi.decflags & this.fxFlags.abstract) && !pvfi)
						absnames += "," + pair.value.fi.$owner.$name + "." + pair.key;
				}
				if(absnames.length > 0)
					classDef.abstractNames = absnames.substring(1);
			}
			else {
				let absnames = "";
				let iter = this.fx.Utils.ObjectIterator.New(classDef.vfuncs);
				while(iter.GetNext()){
					let pair = iter.GetCurrPair();
					if(pair.value.decflags & this.fxFlags.abstract)
						absnames += "," + pair.value.$owner.$name + "." + pair.key;
				}
				if(absnames.length > 0)
					classDef.abstractNames = absnames.substring(1);
			}

			// don't forget to add own ctor and dtor to the end!

			if(classDef.ctor)
				classDef.ctorlist.push(classDef.ctor)
			if(classDef.dtor)
				classDef.dtorlist.push(classDef.dtor)

			// add static members

			if(classDef.staticMembers){
				if(this.restrictedMembersExist(classDef.staticMembers) && (env.IsDevMode() || (classDef.pmc & this.fxFlags.pmc_memaccess)))
					classDef.flags |= this.fxFlags.restrictedStatic;
				this.setMemOO(env, classDef, classDef.staticMembers);
				let ss = (classDef.flags & this.fxFlags.restrictedStatic) ? gcres.staticSentinelRef : null;
				classDef.staticSentinelRef = ss;
				this.addStatic(Class, ss ? ss.sentinel : null)
			}

			let cvnames = this.getConstVarNames(classDef.vars);
			if(cvnames.length > 0)
				classDef.constVarNames = cvnames;

			if(this.restrictedMembersExist(classDef.vars) || this.restrictedMembersExist(classDef.funcs))
				classDef.flags |= this.fxFlags.restrictedMem;

			if(this.constantMemExist(classDef.funcs) || this.constantMemExist(classDef.peVFuncs))
				classDef.flags |= this.fxFlags.constMemFuncs;

			if(this.constantMemExist(classDef.vars))
				classDef.flags |= this.fxFlags.constMemVars;

			// TODO: finish this logic for TODO.1
			if(!(classDef.flags & (this.fxFlags.restrictedMem|this.fxFlags.restrictedStatic|this.fxFlags.constMemVars|this.fxFlags.constMemFuncs)))
				classDef.flags |= this.fxFlags.protoFuncs;
		},
		addStatic: function(Class, sentinel){
			let classDef = Class.prototype._jeepdef_;
			let staticMembers = classDef.staticMembers;
			let impl = this;
			let keys = Object.keys(staticMembers);
			let staticObj = {
				$def: Class,
				$name: Class.$name,
			};
			for(let k = 0; k<keys.length; k++){
				let ky = keys[k];
				let rec = staticMembers[ky];
				if(!sentinel){
					staticObj[keys[k]] = rec.item;
					continue;
				}
				let name = rec.$owner.$name + "." + ky;
				let pubacc = !(rec.memAccessFlag & impl.fxFlags.private);
				let type = typeof rec.item;
				if(type == "function"){
					let func = rec.item;
					rec.item = function(){
						let oldScdf = sentinel.classDef;
						sentinel.classDef = classDef;
						let r = null, ex = null;
						try{r = func.apply(staticObj, arguments)}
						catch(e){ex = e}
						sentinel.classDef = oldScdf;
						if(ex) throw ex;
						return r;
					}
				}
				if(rec.decflags & this.fxFlags.public){
					staticObj[ky] = rec.item;
					continue;
				}
				sentinel.obj[ky] = rec.item;
				Object.defineProperty(staticObj, ky, {
					configurable: false,
					enumerable: true,
					set: function(v){
						let allow = pubacc || (sentinel.classDef === classDef);
						if(!allow)
							impl.abort("restricted-access", {access: "write", spectype: "private static", memtype: type == "function" ? "function" : "variable", name: name})
						sentinel.obj[ky] = v;
					},
					get: function(){
						let allow = pubacc || (sentinel.classDef === classDef);
						if(!allow)
							impl.abort("restricted-access", {access: "read", spectype: "private static", memtype: type == "function" ? "function" : "variable", name: name})
						return sentinel.obj[ky]			
					}
				});
			}
			Class.STATIC = staticObj;
			classDef.staticMembers = staticObj;
		},
		getBases: function(classDef){
			let barr = [];
			if(classDef.bases){
				for(let k = 0; k<classDef.bases.length; k++){
					let b = classDef.bases[k];
					if(typeof b == "string")
						barr.push(this.fx.GetObjectDef(b).prototype._jeepdef_);
					else
						barr.push(b.prototype._jeepdef_);
				}
			}
			return barr;
		},
		flattenBaseDefTree: function(classDef, outArr){
			let barr = this.getBases(classDef);
			for(let k = 0; k<barr.length; k++)
				this.flattenBaseDefTree(barr[k], outArr)
			// loop and push into what is given as argument since concat creates a different object
			for(let k = 0; k<barr.length; k++)
				outArr.push(barr[k])
		},
		mergeBaseClass: function(baseClassDef, classDef, code){
			this.addInheritedMembers(baseClassDef.vars, classDef.vars, code);
			if(baseClassDef.constVarNames){
				classDef.constVarNames = classDef.constVarNames || [];
				classDef.constVarNames = classDef.constVarNames.concat(baseClassDef.constVarNames);
			}
			this.addInheritedMembers(baseClassDef.funcs, classDef.funcs, code);
			if(baseClassDef.ctor && classDef.ctorlist.indexOf(baseClassDef.ctor) < 0)
				classDef.ctorlist.push(baseClassDef.ctor);
			if(baseClassDef.dtor && classDef.dtorlist.indexOf(baseClassDef.dtor) < 0)
				classDef.dtorlist.push(baseClassDef.dtor);
			if(baseClassDef.flags & this.fxFlags.managed)
				classDef.flags |= this.fxFlags.managed;
		},
		addInheritedMembers: function(baseMem, derMem, code){
			if(!baseMem) return;
			let iter = this.fx.Utils.ObjectIterator.New(baseMem);
			while(iter.GetNext()){
				let pair = iter.GetCurrPair();
				let ob = this.cloneObject(pair.value);// because 'code' must be changed
				ob.memAccessCode = code;
				derMem[pair.key] = ob;
			}
		},
		generateClassDef: function(info){
			let impl = this;
			let Class = function(){
				impl.abort("inst-new", {type: "class", name: info.name})
			}
			let jdef = this.createJeepDef({type: "class", name: info.name, desc: info.desc, defobj: Class});
			jdef.vars = info.vars;
			jdef.funcs = info.funcs;
			jdef.vfuncs = info.vfuncs;
			jdef.staticMembers = info.staticMembers;
			jdef.flags |= info.flags
			jdef.pmc = this.getPMCFlags(info.env, jdef.pmc);			
			let staticSentinelRef = this.setupClassDef(info.env, info.name, Class, jdef);
			return {Class: Class, staticSentinelRef: staticSentinelRef};
		},
		setupClassDef: function(env, name, Class, jdef){
			let impl = this;
			Class.prototype._jeepdef_ = jdef;
			let ClassImpl = this.createClassImpl(env, name);

			// Since staticSentinel creation is deferred untill hierarchy is merged, and this function is
			// called before that, this reference mechanism allows a delayed creation of the sentinel, if
			// necessary, such that things work seamlessly.
			let staticSentinelRef = {
				sentinel: {
					classDef: null, 
					obj: {}
				}
			};

			let commonAccess = this.createRecursiveFlag();
			function Instantiate(initNew, arguments){
				let instArgs = {
					jdef: jdef,
					Class: Class,
					initNewVars: null,
					initNewObj: null,
					copyInst: null,
					instSentinel: impl.sentinelStruct.New(),
					staticSentinel: staticSentinelRef.sentinel,
					commonAccess: commonAccess,
				}
				if(arguments.length === 1){
					let inp = arguments[0];
					instArgs.initNewObj = inp;
					let errors = []
					instArgs.initNewVars = impl.testInitNew(env, inp, jdef.vars, errors)
					if(!instArgs.initNewVars){
						if(initNew && env.IsDevMode())
							impl.abort("initnew-fail", {type: "class", name: name, errnames: errors.join(',')})
						else if(Class.InstanceOf(inp))
							instArgs.copyInst = inp;
					}
				}
				let inst = new ClassImpl(instArgs, arguments);
				Object.seal(inst);
				return inst;
			}
			if(!(jdef.flags & (this.fxFlags.protected|this.fxFlags.private))){
				Class.New = function(){
					if(arguments.length > 0 && jdef.ctorlist.length == 0)
						impl.abort("new-noctor", {name: name, type: "class"})
					return Instantiate(false, arguments)
				},
				Class.InitNew = function(){
					if((!env || env.IsDevMode())){
						if(arguments.length === 0)
							impl.abort("initnew-noargs", {name: name, type: "class"})
						if(arguments.length !== 1)
							impl.abort("initnew-moreargs", {name: name, type:"class"})
					}
					return Instantiate(true, arguments)
				}
			}
			if(jdef.flags & this.fxFlags.private){
				let privinst = null;
				Class.CreateInstance = function(){
					if(privinst)
						impl.abort("createinstance-dup", {name: Class.$name})
					privinst = Instantiate(false, arguments);
					return privinst;
				}
				Class.GetInstance = function(){
					if(privinst && (arguments.length > 0))
						impl.showWarning("getinstance-args", {name: Class.$name})
					return privinst;
				}
			}
			Class.InstanceOf = function(other){
				if(!other._jeepdef_)
					return false;
				if(other._jeepdef_ === jdef)
					return true;
				// try checking the hierarchy if one exists
				return (other._jeepdef_.flatBaseDefs && (other._jeepdef_.flatBaseDefs.indexOf(jdef) >= 0))
			}
			return staticSentinelRef;
		},
		createClassImpl: function(env, name){
			let impl = this;
			return function(args, arguments){
				this.$name = name;
				this._jeepdef_ = args.jdef;
				
				// this will abort if necessary
				impl.checkInstantiability(this, args.instSentinel, args.staticSentinel, env, args.commonAccess);

				impl.setupClassInstance(this, env, args.commonAccess, args.instSentinel, args.staticSentinel);

				if(args.copyInst){
					impl.runCopyConstructor(args.copyInst, this, args.instSentinel);
				}
				else if(args.initNewVars){
					impl.doInitNew(this, args.initNewObj, args.initNewVars)
					this.$initnew = true;
				}

				if(!args.copyInst){
					if(args.instSentinel){
						args.instSentinel.memAccessFlag.add();
						args.instSentinel.internalAccess.add();
						if(env.IsDevMode() && (env.impl.getFlags() & impl.envFlags.trap_vcall))
							args.instSentinel.propFlags |= impl.fxFlags.novirtual|impl.fxFlags.ctorcall;
					}
					if(args.staticSentinel)
						args.staticSentinel.classDef = args.jdef;

					let k = 0;
					let freason = "";
					for(k = 0; k<this._jeepdef_.ctorlist.length; k++){
						try{
							freason = this._jeepdef_.ctorlist[k].apply(this, arguments);
							if(freason !== undefined){
								freason = freason.toString();
								break;
							}
						}
						catch(ex){
							if(this.$novirtual) throw ex;
							this.$dindex = k;
							this.$ctorex = ex;
							impl.abort("constructor-failure-ex", {name: name, ex: ex.message || ex})
						}
					}
					if(k < this._jeepdef_.ctorlist.length){								
						this.$dindex = k;
						impl.abort("constructor-failure-ret", {name: name, reason: freason})
					}

					if(args.staticSentinel)
						args.staticSentinel.classDef = null;
					if(args.instSentinel){
						args.instSentinel.memAccessFlag.remove();
						args.instSentinel.internalAccess.remove();
						args.instSentinel.propFlags &= ~(impl.fxFlags.novirtual|impl.fxFlags.ctorcall);
					}
				}

				// Now, swap the virtual functions. What existed till now was the base class ones. This was
				// done in order to disable polymorphism from constructors.
				impl.enablePolymorphism(this, true, args.instSentinel, env, args.commonAccess);

				if(this.$initnew)
					delete this.$initnew;
			}			
		},
		destroyInstance: function(inst, dindex, sentinel, staticSentinel, commonAccess, env){
			if(inst._jeepdef_.dtorlist.length > 0){
				sentinel.memAccessFlag.add();
				sentinel.internalAccess.add();
				if(staticSentinel)
					staticSentinel.classDef = inst._jeepdef_;
				this.enablePolymorphism(inst, false, sentinel, env, commonAccess)
				dindex = dindex || inst._jeepdef_.dtorlist.length;
				if(env.IsDevMode() && (env.impl.getFlags() & this.envFlags.trap_vcall))
					sentinel.propFlags |= this.fxFlags.novirtual;
				if(sentinel.propFlags & this.fxFlags.ctorcall)
					sentinel.propFlags &= ~(this.fxFlags.ctorcall);
				for(let j = dindex-1; j>=0; j--){						
					try{inst._jeepdef_.dtorlist[j].apply(inst)}
					catch(e){return e}
				}
				if(staticSentinel)
					staticSentinel.classDef = null;
				sentinel.memAccessFlag.remove();
				sentinel.internalAccess.remove();
				sentinel.propFlags &= ~this.fxFlags.novirtual;
			}
		},
		swapVFuncs: function(inst, vfuncs, sentinel, env, commonAccess){
			let swap = {};
			let keys = Object.keys(vfuncs)
			for(let k = 0; k<keys.length; k++){
				let ofi = vfuncs[keys[k]]
				let fi = this.cloneObject(ofi);
				let func = fi.item;
				fi.item = function(){return func.apply(inst, Array.prototype.slice.call(arguments, 0))};
				swap[keys[k]] = fi;
			}
			if(sentinel)
				sentinel.internalAccess.add();
			this.addDirectedFunctions(env, inst, swap, commonAccess, sentinel);
			if(sentinel)
				sentinel.internalAccess.remove();
		},
		enablePolymorphism: function(inst, enable, sentinel, env, commonAccess){
			if(enable){
				if(inst._jeepdef_.peVFuncs) 
					this.swapVFuncs(inst, inst._jeepdef_.peVFuncs, sentinel, env, commonAccess);
			}
			else {
				if(inst._jeepdef_.pdVFuncs) 
					this.swapVFuncs(inst, inst._jeepdef_.pdVFuncs, sentinel, env, commonAccess);
			}
		},
		checkInstantiability: function(inst, sentinel, staticSentinel, env, commonAccess) {
			if(inst._jeepdef_.flags & this.fxFlags.managed){
				if(!this.managedStack.isMarked())
					this.abort("managed-inst-location", {name: inst.$name})
				this.managedStack.push(inst, sentinel, staticSentinel, env, commonAccess);
			}				
			if(inst._jeepdef_.abstractNames){
				this.abort("abstract-class", {name: inst.$name, absnames: inst._jeepdef_.abstractNames})
			}
		},
		setupClassInstance: function(inst, env, commonAccess, sentinel, staticSentinel){
			inst.$def = inst._jeepdef_.$def;

			// Note: since several things, especially the sentinel based functions, need to be 
			// instance specific, the instantiation will be slow, if restriction is enabled. But
			// this is the best possible way to do this because instantiation happens only once
			// whereas restriction checks happen per function call. So, mechanisms like mapping
			// instance to sentinel, due to which member functions can be added to prototype, will 
			// make instantion very fast but everything else very slow because every sentinel access
			// needs to access it from the map. With this method, we get the opposite performance.

			// initialize wrappers if any before constructing the instance
			if(inst._jeepdef_.wrapperInits.length > 0){
				let wargs = Array.prototype.slice.call(arguments,3);
				for(let k = 0; k<inst._jeepdef_.wrapperInits.length; k++){
					let argobj = {inst: inst, env: env, sentinel: sentinel, staticSentinel: staticSentinel, commonAccess: commonAccess}
					inst._jeepdef_.wrapperInits[k].apply(this, [argobj].concat(wargs));
				}
			}

			// since constantness is checked inside 'set' of the variable property, it is important to test that flags aswell
			let restricted = env.IsDevMode() || (
				(inst._jeepdef_.pmc & this.fxFlags.pmc_memaccess) || 
				((inst._jeepdef_.pmc & this.fxFlags.pmc_constfuncs) && (inst._jeepdef_.flags & this.fxFlags.constMemFuncs)) ||
				((inst._jeepdef_.pmc & this.fxFlags.pmc_constvars) && (inst._jeepdef_.flags & this.fxFlags.constMemVars)) ||
				(env.impl.getFlags() & this.envFlags.trap_vcall)
				)
			if(restricted){
				sentinel.propFlags |= this.sentinelFlags.restrictedAccess;
				this.setAccessRestriction(inst, inst._jeepdef_.vars, sentinel, commonAccess);
				this.setAccessRestriction(inst, inst._jeepdef_.funcs, sentinel, commonAccess);
				let impl = this;
				inst.ExternalCall = function(f){
					if(!f) return;
					let r = null, ex = null;
					let oldCode = sentinel.memAccessCode;
					sentinel.memAccessCode = -1;
					sentinel.memAccessFlag.add();
					let oldCA = commonAccess.counter;
					commonAccess.counter = 0;
					try{r = f.apply(null, Array.prototype.slice.call(arguments,1));}
					catch(e){ex=e}
					commonAccess.counter = oldCA;
					sentinel.memAccessFlag.remove();
					sentinel.memAccessCode = oldCode;
					if(ex) throw ex;
					return r;
				}
			}
			else {
				this.addMembers(inst, inst._jeepdef_.vars);
				this.addMembers(inst, inst._jeepdef_.funcs);
				inst.ExternalCall = function(f){return !f?undefined:f.apply(null, Array.prototype.slice.call(arguments,1));}
			}

			sentinel.internalAccess.add();
			let funcs = {};
			this.merge(inst._jeepdef_.funcs, funcs)
			this.merge(inst._jeepdef_.wrapFuncs, funcs)
			this.addDirectedFunctions(env, inst, funcs, commonAccess, sentinel, staticSentinel);
			sentinel.internalAccess.remove();

			// setup static members

			inst.$static = inst.$def.STATIC;// this will work either way
			if(inst._jeepdef_.flatBaseDefs){
				let base = {};
				for(let k = 0; k<inst._jeepdef_.flatBaseDefs.length; k++){
					let bd = inst._jeepdef_.flatBaseDefs[k];
					if(bd.staticMembers)
						base[bd.$name] = bd.staticMembers;
				}
				if(Object.keys(base).length > 0){
					inst.$static = inst.$static || {};
					inst.$static.$base = base;
				}
			}

			// create base object

			if(inst._jeepdef_.instBase){
				let base = {};
				let biter = this.fx.Utils.ObjectIterator.New(inst._jeepdef_.instBase);
				while(biter.GetNext()){
					let bpair = biter.GetCurrPair();
					let fmap = bpair.value;
					let fiter = this.fx.Utils.ObjectIterator.New(fmap);
					base[bpair.key] = {};
					while(fiter.GetNext()){
						let fpair = fiter.GetCurrPair();					
						let func = fpair.value.item;
						base[bpair.key][fpair.key] = function(){return func.apply(inst, Array.prototype.slice.call(arguments, 0))};
					}
					inst.$base = base;
				}
			}
		},
		getConstVarNames: function(src){	
			let vars = [];		
			if(!src) return vars;
			let keys = Object.keys(src);
			for(let k = 0; k<keys.length; k++){
				let ob = src[keys[k]];
				if(typeof ob.item == "function")
					continue; 
				if(ob.decflags & this.fxFlags.constant)
					vars.push(keys[k]);
			}
			return vars;
		},
		getVarValues: function(inst, vars){
			let vals = [];
			for(let k = 0; k<vars.length; k++)
				vals.push(inst[vars[k]])
			return vals;
		},
		getVariableHash: function(arr){
			let res = [];	
			for(let k = 0; k<arr.length; k++)
				res.push(JSON.stringify(arr[k]));
			return res;
		},
		getChangedVarsFromHash: function(vals, names, old, pref){
			let h = this.getVariableHash(vals);
			let ch = "";
			// length will be same since it will be the same set of variables, only values could have changed
			for(let k = 0; k<old.length; k++){
				if(h[k] != old[k])
					ch += pref+"."+names[k] + ","
			}
			return ch.substring(0, ch.length-1);// remove last comma
		},
		validateFuncArgs: function(fname, args, ref){
			let rkeys = Object.keys(ref);
			if(args.length != rkeys.length)
				this.abort("argnum-fail", {func: fname, declared: rkeys.length, given: args.length})
			let err = [];
			for(let k = 0; k<args.length; k++){
				let a = args[k];
				let r = ref[k];
				let t = typeof a;
				if(r.tname == "" || r.tname == t) 
					continue;
				let isarr = Array.isArray(a);
				if(t == "object"){
					if(r.tname == "array" && isarr)
						continue;
					if(isarr)
						t = "array";// needed for precise error message
				}
				if(r.tname != "string" && r.tname != "number" && r.tname != "object" && r.tname != "array"){
					let def = this.getDef(r.tname, true) // nothrow
					if(!def)
						this.abort("argtype-unreg", {type: r.tname, func: fname})
					if(def.InstanceOf(a))
						continue;
					t = a._jeepdef_ ? a._jeepdef_.$name : t;
				}						
				err.push(r.vname+"("+r.tname+","+"*"+t+")")
			}
			if(err.length > 0)
				this.abort("argtype-fail", {func: fname, args: err.join(',')})
		},
		addDirectedFunctions: function(env, inst, funcs, commonAccess, sentinel, ownStaticSentinel){
			if(!funcs) return;
			let keys = Object.keys(funcs);
			let impl = this;
			let pmc = inst._jeepdef_.pmc;
			let devmode = env.IsDevMode();
			let restricted = devmode || ((pmc & this.fxFlags.pmc_memaccess) && (inst._jeepdef_.flags & this.fxFlags.restrictedMem))
			for(let k = 0; k<keys.length; k++){
				let fname = inst.$name+"."+keys[k];
				let fi = funcs[keys[k]];
				let flags = fi.decflags;
				let realf = fi.item;
				// TODO: fix this intricate logic for TODO.1
				// if((flags == 0) && !restricted){
				// 	inst[keys[k]] = realf;
				// 	continue;
				// }
				inst[keys[k]] = function(){
					/* preprocess flags etc on sentinel, cache things if necessary */

					// argnum failure can abort early since its just a check of argument count
					if((flags & impl.fxFlags.argnum) && (devmode || (pmc & impl.fxFlags.pmc_argnum))){
						if(arguments.length != realf.length)
							impl.abort("argnum-fail", {func: fname, declared: realf.length, given: arguments.length})
					}
					if((flags & impl.fxFlags.argnumvar) && (devmode || (pmc & impl.fxFlags.pmc_argnum))){
						if(arguments.length < realf.length)
							impl.abort("argnum-fail", {func: fname, declared: realf.length, given: arguments.length})
					}
					// argtype failure can abort early since its just a check of argument types
					if((flags & impl.fxFlags.argtype) && (devmode || (pmc & impl.fxFlags.pmc_argtype))){
						impl.validateFuncArgs(fname, Array.prototype.slice.call(arguments,0), fi.targs);
					}
					if(flags & impl.fxFlags.managed){
						impl.managedStack.mark();
					}
					sentinel.pushFunc(fname);
					let arghash = null, constVars = inst._jeepdef_.constVarNames;
					if((flags & impl.fxFlags.argconst) && (devmode || (pmc & impl.fxFlags.pmc_argconst)))
						arghash = impl.getVariableHash(Array.prototype.slice.call(arguments,0))
					if(constVars && !sentinel.cvhash && (devmode || (pmc & impl.fxFlags.pmc_constvars)))
						sentinel.cvhash = impl.getVariableHash(impl.getVarValues(this, constVars))
					if((flags & impl.fxFlags.constant) && (devmode || (pmc & impl.fxFlags.pmc_constfuncs)))
						sentinel.constFlag.add();
					if(sentinel.propFlags & impl.sentinelFlags.restrictedAccess)
						sentinel.memAccessFlag.add();
					let oldCode = sentinel.memAccessCode;
					sentinel.memAccessCode = fi.memAccessCode;
					let oldStatCdef = null;
					let staticSentinel = ownStaticSentinel;
					if(fi.$owner && fi.$owner.staticSentinelRef) 
						staticSentinel = fi.$owner.staticSentinelRef.sentinel;
					if(staticSentinel){
						oldStatCdef = staticSentinel.classDef
						staticSentinel.classDef = fi.$owner;
					}
					let thisObj = realf.thisObj || this;
					let oldStatic = thisObj.$static;
					thisObj.$static = fi.$owner.staticMembers;
					commonAccess.add();

					/* run the actual function */
					
					let ex = null;
					let r = null;
					try {r = realf.apply(thisObj, arguments)}
					catch(e){ex = e;}

					/* postprocess, restore things if necessary */
					
					commonAccess.remove();
					thisObj.$static = oldStatic;
					if(staticSentinel)
						staticSentinel.classDef = oldStatCdef;
					if((flags & impl.fxFlags.constant) && (devmode || (pmc & impl.fxFlags.pmc_constfuncs)))
						sentinel.constFlag.remove();
					if(sentinel.propFlags & impl.sentinelFlags.restrictedAccess)
						sentinel.memAccessFlag.remove();
					if(flags & impl.fxFlags.managed)
						impl.managedStack.unwind()
					sentinel.memAccessCode = oldCode;
					let trace = sentinel.getCallChain();// cache for possible aborting
					sentinel.popFunc();

					/* exit the function as necessary */
					
					// throw only after resetting everything because caller might catch and continue
					// which won't restore things and all hell will break lose.
					if(ex) throw ex;
					if(sentinel.cvhash){
						let ch = impl.getChangedVarsFromHash(impl.getVarValues(this, constVars), constVars, sentinel.cvhash, inst.$name);
						if(ch.length > 0){
							sentinel.cvhash = null;// not needed anymore now that hashtest failed
							impl.abort("const-var-change-detected", {trace: trace, names: ch})
						}
					}
					if(arghash){
						let ch = impl.getChangedVarsFromHash(Array.prototype.slice.call(arguments,0), Array.from(Array(arguments.length).keys()), arghash, "arg")
						if(ch.length > 0)
							impl.abort("argconst--fail", {func: fname, args: ch})
					}
					return r;
				}
			}
		},
		getArgFuncInfo: function(env, f, fname){			
			let s = f.toString();
			let m = s.match(this.rxArgFuncSyntax);
			if(!m){
				this.addSyntaxError("argtype-syntax", {func: fname})
				return null;
			}
			let r = this.undecorateFuncArgs(env, m[2], fname);
			if(!r) 
				return null; // error will have been added by undecorateFuncArgs
			let args = this.splitTrim(m[3]);
			if(args.length != r.length){
				this.addSyntaxError("argtype-count", {func: fname})
				return null;
			}
			for(let k = 0; k<args.length; k++){
				if(args[k] != r[k].vname){
					this.addSyntaxError("argtype-names", {func: fname})
					return null;
				}
			}
			let ff = f();
			return {func: ff, args: r};
		},
		runCopyConstructor: function(copy, inst, sentinel){
			if(sentinel){
				sentinel.memAccessFlag.add();
				sentinel.internalAccess.add();
			}			
			let keys = Object.keys(copy);
			for(let k = 0; k<keys.length; k++){
				let ky = keys[k]
				if(typeof copy[ky] !== 'function')
					inst[ky] = copy[ky]
			}
			if(sentinel){
				sentinel.memAccessFlag.remove();
				sentinel.internalAccess.remove();
			}
		},
		createFwdFunc: function(f, thisObj){
			return function(){
				let r = null;
				let ex = null;
				let old = null;
				let ssref = thisObj._jeepdef_.staticSentinelRef;
				if(ssref){
					old = ssref.sentinel.classDef;
					ssref.sentinel.classDef = thisObj._jeepdef_;
				}
				try{r = f.apply(thisObj, Array.prototype.slice.call(arguments, 0))}
				catch(e){ex = e}
				if(ssref)
					ssref.sentinel.classDef = old;
				if(ex) throw ex;
				return r;
			}
		},
		createWrFuncs: function(src, wf, inst, uninc){
			if(!src) return;
			let ikeys = Object.keys(src);
			for(let k = 0; k<ikeys.length; k++){
				let ky = ikeys[k];
				let nky = ky;
				if(uninc)
					nky = uninc[ky] || ky;
				let fi = this.cloneObject(src[ky]);
				fi.item = this.createFwdFunc(fi.item, inst);
				fi.item.thisObj = inst;
				wf[nky] = fi;
			}
		},
		createWrCDList: function(inst, wr, classDef, lstname){
			let list = [];
			let orig = classDef[lstname];
			if(orig.length == 0)
				return;
			for(let k = 0; k<orig.length; k++)
				list.push(this.createFwdFunc(orig[k], wr))
			if(!inst._jeepdef_[lstname])
				inst._jeepdef_[lstname] = list;
			else if(orig.length > 0){
				let k = inst._jeepdef_[lstname].indexOf(orig[orig.length-1])
				inst._jeepdef_[lstname] = list.concat(inst._jeepdef_[lstname].slice(k+1))
			}
		},
		validateWrapperMap: function(map, classDef, type){
			if(!map) return;
			let errors = [], ns = [];
			let prop = type == "functions" ? "funcs" : "vars";
			let keys = Object.keys(map);
			for(let k = 0; k<keys.length; k++){
				let ky = keys[k];
				if(typeof map[ky] !== "string")
					ns.push(ky);
				if(!classDef[prop][ky])
					errors.push(ky)
			}
			if(ns.length > 0)
				this.addSyntaxError("wrapper-map-value", {type: type, keys: ns.join(',')})
			if(errors.length > 0)
				this.addSyntaxError("wrapper-members-absent", {memtype: type, mnames: errors.join(',')})
		},
		createClassWrapper: function(env, cn, def){
			let impl = this;
			let className = cn;
			let wrapDef = def;

			/* validate */

			let badProps = impl.validateProps(def, "Functions, Variables");
			if(badProps)
				impl.abort("invalid-props", {api: "CreateClassWrapper", props: badProps.join(',')})
			let classDefObj = this.getDef(className, true); // nothrow
			if(!classDefObj)
				this.abort("wrapper-nodef", {name: className});
			if(!wrapDef.Functions && !wrapDef.Variables)
				this.abort("wrapper-nomap", {name: className});
			let classDef = classDefObj.prototype._jeepdef_;
			let iter = this.fx.Utils.ObjectIterator.New({});

			// No need to check duplicate names in function and variable maps since classes with such 
			// members are not generated in the first place. any such map given will cause 'member absent'
			// error to be sisued.

			this.validateWrapperMap(wrapDef.Variables, classDef, "variables");
			this.validateWrapperMap(wrapDef.Functions, classDef, "functions");
			this.abortOnSyntaxError("wrapper class", className);

			/* create */
			
			let Wrapper = function(){
				impl.abort("wrapper-instantiated", {name: className})
			}
			let jdef = this.createJeepDef({type: "class", name: className, desc: classDef, defobj: Wrapper});

			// cloning is needed so as to not cause damage to the wrapped class definition when old 
			// members are removed and new ones added
			jdef.vars = this.cloneObject(classDef.vars || {})
			jdef.constVarNames = this.cloneObject(classDef.constVarNames || [])
			jdef.funcs = this.cloneObject(classDef.funcs || {})
			jdef.vfuncs = this.cloneObject(classDef.vfuncs || {})
			jdef.ctorlist = this.cloneObject(classDef.ctorlist || {})
			jdef.dtorlist = this.cloneObject(classDef.dtorlist || {})
			jdef.ctor = classDef.ctor;
			jdef.dtor = classDef.dtor;
			jdef.pmc = classDef.pmc;
			jdef.flags = classDef.flags;
			jdef.flatBaseDefs = classDef.flatBaseDefs;

			if(wrapDef.Variables){
				iter.Reset(wrapDef.Variables);
				while(iter.GetNext()){
					let pair = iter.GetCurrPair();
					let fi = jdef.vars[pair.key];
					if(fi){
						delete jdef.vars[pair.key];
						jdef.vars[pair.value] = fi;
					}
				}		
			}

			if(wrapDef.Functions){
				iter.Reset(wrapDef.Functions);
				while(iter.GetNext()){
					let pair = iter.GetCurrPair();
					let fi = jdef.funcs[pair.key];
					if(fi){
						delete jdef.funcs[pair.key];
						jdef.funcs[pair.value] = fi;
					}
					fi = jdef.vfuncs[pair.key];
					if(fi){
						delete jdef.vfuncs[pair.key];
						jdef.vfuncs[pair.value] = fi;
					}
				}		
			}

			// setup the initializer
			// winfo = {inst, env, sentinel, staticSentinel, commonAccess}
			// this = impl
			let winit = function(winfo){
				let inst = winfo.inst;
				let winst = {
					$static: null,
					_jeepdef_: null,
				};
				this.mergeMembers(winst, classDef.vars)
				this.mergeMembers(winst, classDef.funcs)
				this.mergeMembers(winst, classDef.peVFuncs)
				winst.$static = classDefObj.STATIC;
				winst._jeepdef_ = classDef;
				let wkeys = Object.keys(winst);
				for(let k = 0; k<wkeys.length; k++){			
					let kname = wkeys[k];
					let vname = undefined;
					if(wrapDef.Functions)
						vname = wrapDef.Functions[kname]
					if(!vname && wrapDef.Variables)
						vname = wrapDef.Variables[kname]
					vname = vname || kname;
					if(vname === "$static" || vname === "_jeepdef_")
						continue;
					Object.defineProperty(winst, kname, {
						configurable: false,
						enumerable: true,
						get: function(){
							winfo.sentinel.internalAccess.add();
							let oldStatCdef = null;
							if(winfo.staticSentinel){
								oldStatCdef = winfo.staticSentinel.classDef;
								winfo.staticSentinel.classDef = winst._jeepdef_;
							}
							let r = inst[vname];
							if(winfo.staticSentinel){
								winfo.staticSentinel.classDef = oldStatCdef;
							}
							winfo.sentinel.internalAccess.remove();
							return r;
						},
						set: function(v){
							let oldStatCdef = null;
							if(winfo.staticSentinel){
								oldStatCdef = winfo.staticSentinel.classDef;
								winfo.staticSentinel.classDef = winst._jeepdef_;
							}
							winfo.sentinel.internalAccess.add();
							if(winfo.staticSentinel){
								winfo.staticSentinel.classDef = oldStatCdef;
							}
							inst[vname] = v
							winfo.sentinel.internalAccess.remove();
						}
					});
				}
				let wrapFuncs = {};
				this.createWrFuncs(classDef.funcs, wrapFuncs, winst, wrapDef.Functions)
				this.createWrFuncs(classDef.peVFuncs, wrapFuncs, winst, wrapDef.Functions)
				if(Object.keys(wrapFuncs).length > 0)
					inst._jeepdef_.wrapFuncs = wrapFuncs;
				this.createWrCDList(inst, winst, classDef, "ctorlist")
				this.createWrCDList(inst, winst, classDef, "dtorlist")
			}
			// make sure existing wrapper inits are not left out
			jdef.wrapperInits = [winit].concat(classDef.wrapperInits);
			Wrapper.prototype._jeepdef_ = jdef;
			return Wrapper;
		},
		//----------------------------------------
		// field
		//----------------------------------------
		createField: function(env, where, name, def){
			let devmode = env.IsDevMode();
			let funcs = {};
			let res = this.splitVarFunc(def);
			if(devmode && res.vars)
				this.addSyntaxError("field-hasvars", {})
			if(devmode && !res.funcs)
				this.addSyntaxError("field-nofuncs", {})
			else
				funcs = this.undecorateFuncs("field", env, res.funcs);

			let inst = where || window;
			if(devmode && res.funcs){
				let err = ""
				let fnames = Object.keys(res.funcs)
				for(let k = 0; k<fnames.length; k++){
					if(inst[fnames[k]] !== undefined)
						err += ","+fnames[k]
				}
				if(err.length > 0)
					this.addSyntaxError("field-group-dupnames", {type: "field", dupnames: err.substring(1)})
			}
			this.abortOnSyntaxError("field", name)			

			let sentinel = this.sentinelStruct.New();
			// add these two to mimic an instance so piggback on addDirectedFunctions
			inst.$name = name;
			inst._jeepdef_  = {
				vars:  {},
				funcs: {},
				ctorlist: [],
				dtorlist: [],
			};
			this.setMemOO(env, {staticMembers: null}, funcs);
			let commonAccess = this.createRecursiveFlag();
			this.addDirectedFunctions(env, inst, funcs, commonAccess, sentinel);
		},
		//----------------------------------------
		// group
		//----------------------------------------
		createGroup: function(api, where, name, def, env){
			let Group = this.generateClass(api, name, def, env, "group").Class;

			let groupDef = Group.prototype._jeepdef_;
			let mems = {};
			this.merge(groupDef.funcs.public, mems);
			this.merge(groupDef.funcs.private, mems);
			groupDef.funcs = mems;
			mems = {};
			this.merge(groupDef.vars.public, mems);
			this.merge(groupDef.vars.private, mems);
			groupDef.vars = mems;
			this.setMemberOwnerOrigin(env, groupDef);			

			let inst = where || window;
			if(env.IsDevMode()){
				if(Object.keys(groupDef.funcs).length == 0)
					this.addSyntaxError("class-group-empty", {type: "group", mem: "functions"})

				let err = ""
				let fnames = Object.keys(groupDef.funcs)
				for(let k = 0; k<fnames.length; k++){
					if(inst[fnames[k]] !== undefined)
						err += ","+fnames[k]
				}
				if(err.length > 0)
					this.addSyntaxError("field-group-dupnames", {type: "group", dupnames: err.substring(1)})
			}
			this.abortOnSyntaxError("group", name);		

			if(groupDef.ctor)
				groupDef.ctorlist.push(groupDef.ctor)
			
			if(this.restrictedMembersExist(groupDef.vars) || this.restrictedMembersExist(groupDef.funcs))
				groupDef.flags |= this.fxFlags.restrictedMem;

			if(this.constantMemExist(groupDef.funcs))
				groupDef.flags |= this.fxFlags.constMemFuncs;

			if(this.constantMemExist(groupDef.vars))
				groupDef.flags |= this.fxFlags.constMemVars;

			let restricted = env.IsDevMode() || (
				(groupDef.pmc & this.fxFlags.pmc_memaccess) || 
				((groupDef.pmc & this.fxFlags.pmc_constfuncs) && (groupDef.flags & this.fxFlags.constMemFuncs)) ||
				((groupDef.pmc & this.fxFlags.pmc_constvars) && (groupDef.flags & this.fxFlags.constMemVars))
				)
			let sentinel = null;
			if(restricted){
				// add these two to mimic an instance, a hack to avoid breaking the function into fines pieces
				inst.$name = name;
				inst._jeepdef_  = groupDef;
				let commonAccess = this.createRecursiveFlag();
				sentinel = this.sentinelStruct.New();
				sentinel.propFlags |= this.sentinelFlags.restrictedAccess;
				this.setAccessRestriction(inst, groupDef.vars, sentinel, commonAccess);
				this.setAccessRestriction(inst, groupDef.funcs, sentinel, commonAccess);
				sentinel.internalAccess.add();
				this.addDirectedFunctions(env, inst, groupDef.funcs, commonAccess, sentinel);
				sentinel.internalAccess.remove();
			}
			else {
				this.addMembers(inst, groupDef.vars);
				this.addMembers(inst, groupDef.funcs);
			}

			if(groupDef.ctorlist.length > 0){
				let initialized = false;
				inst.Init = function(){
					if(!initialized){
						if(sentinel){
							sentinel.internalAccess.add();
							sentinel.memAccessFlag.add();
						}
						groupDef.ctorlist[0].apply(inst, arguments)
						if(sentinel){
							sentinel.internalAccess.remove();
							sentinel.memAccessFlag.remove();
						}
					}
					initialized = true;
				}
			}
		},
		//----------------------------------------
		// namespace
		//----------------------------------------
		partitionNamespace: function(env, names, nsobj){
			let devmode = env.IsDevMode();
			let parts = nsobj.$ || {}, err = [];
			let narr = this.splitTrim(names);
			for(let k = 0; k<narr.length; k++){
				if(devmode && nsobj.$ && nsobj.$[narr[k]]){
					err.push(narr[k])
					continue;
				}
				parts[narr[k]] = env.CreateNamespace();
			}
			if(err.length > 0)
				this.abort("namespace-partition-duplicate", {parts: err.join(',')})
			nsobj.$ = parts;			
		},
		flattenNamespace: function(env, ns, flatobj, errors){
			if(!ns) return;
			let devmode = env.IsDevMode();
			let iter = this.fx.Utils.ObjectIterator.New(ns);
			while(iter.GetNext()){
				let p = iter.GetCurrPair();
				if(devmode && flatobj[p.key]){
					errors.push(p.key)
					continue;
				}
				this.flattenNamespace(env, p.value.$, flatobj, errors);
				flatobj[p.key] = p.value;
			}
		},
		//----------------------------------------
		// library
		//----------------------------------------
		registerLibrary: function(name, initFunc){
			let rec = this.library[name];
			if(rec)
				this.abort("library-duplicate", {name: name})
			this.library[name] = this.libRecord.InitNew({init: initFunc});
		},
		registerLibraryBuilder: function(name, libname, initFunc){
			let rec = this.library[name];
			if(rec)
				this.abort("library-builder-main", {name: name})
			rec = this.library[libname];
			if(!rec)
				this.abort("library-absent", {name: libname, bname: name})
			if(rec.builders[name] !== undefined)
				this.abort("library-builder-duplicate", {name: name})
			rec.builders[name] = initFunc;
		},
		getLibrary: function(name){
			let impl = this.impl;
			let env = this.env;
			let rec = impl.library[name];
			if(!rec)
				impl.abort("library-unregistered", {name: name})
			if(!rec.namespace){
				rec.namespace = env.CreateNamespace();

				// Note: For the Build functions, the apply could have used just 'this', which would
				// have been 'thisObj' and the this.namespace inside the Build functions would have
				// been the correct one. However, impl.buildLibrary needs 'impl', and adding it to
				// 'thisObj' would be bad design because that will be exposed to third party functions,
				// which are what the ones mentioned in the map will be. So, instead of being lazy, to
				// keep things well designed, 'bthis' is created and used.

				let bthis = {
					$name: name,
					namespace: rec.namespace,
					impl: impl,
				}
				let thisObj = {
					$name: name,
					namespace: rec.namespace,
					Build: function(map){return impl.buildLibrary.apply(bthis, [rec, env, name, "Build", map])},
					BuildPrivate: function(map){return impl.buildLibraryPrivate.apply(bthis, [rec, env, name, "BuildPrivate", map])},
				};
				rec.init.apply(thisObj, Array.prototype.slice.call(arguments,1));
			}
			return rec.namespace;
		},
		// this will be applied with a modified libRecord object, so usage of 'this' is based on that
		// map = {part-name: {func-name, [func-args]}}
		buildLibrary: function(rec, env, libname, api, map){
			// first partition; if parts exist already, let it raise exception
			let parts = "";
			let iter = this.impl.fx.Utils.ObjectIterator.New(map);
			while(iter.GetNext())
				parts += ","+iter.GetCurrPair().key;// comma prefixed not suffixed for easier transformation later
			this.namespace.Partition(parts.substring(1));// pop the first comma
			// now build on each of those parts
			iter.Reset(map);
			let impl = this.impl;
			while(iter.GetNext()){
				let pair = iter.GetCurrPair();
				let initFunc = rec.builders[pair.value.builder];
				if(initFunc === undefined)
					impl.abort("library-builder-absent", {libname: libname, bname: pair.value.builder})
				let badProps = impl.validateProps(pair.value, "builder, args")
				if(badProps)
					impl.abort("invalid-builder-map", {api: api, libname: libname, bname: pair.key, props: badProps.join(',')})
				if(!pair.value.args)
					pair.value.args = [];
				if(!Array.isArray(pair.value.args))
					pair.value.args = [pair.value.args]
				let bthis = {
					$name: libname,
					namespace: pair.key.length > 0 ? this.namespace.$[pair.key] : this.namespace,
					impl: impl,
				}
				let thisObj = {
					$name: libname+"/"+pair.value.builder,
					namespace: pair.key.length > 0 ? this.namespace.$[pair.key] : this.namespace,
					Build: function(map){return impl.buildLibrary.apply(bthis, [rec, env, libname, "Build", map])},
					BuildPrivate: function(map){return impl.buildLibraryPrivate.apply(bthis, [rec, env, libname, "BuildPrivate", map])},
				};
				initFunc.apply(thisObj, pair.value.args);			
			}
		},
		// the usage of 'this' here is similar to that of buildLibrary
		buildLibraryPrivate: function(rec, env, libname, api, map){
			this.namespace = env.CreateNamespace();
			this.impl.buildLibrary.apply(this, [rec, env, libname, api, map]);
			return this.namespace;
		},
		//----------------------------------------
		// implementation helpers
		//----------------------------------------
		validateName: function(env, type, name, internal){
			if(name.indexOf('.') >= 0 && !internal)
				this.abort("invalid-name", {name: name, type: type})
		},
		validateRegister: function(env, type, name, internal){
			this.validateName(env, type, name, internal);
			let rec = this.defstore[name];
			if(rec){
				let atype = "<unkown>"
				if(rec.type & this.objFlags.record)
					atype = "record";
				else if(rec.type & this.objFlags.struct)
					atype = "struct";
				if(rec.type & this.objFlags.class)
					atype = "class";
				if(rec.type & this.objFlags.field)
					atype = "field";
				if(rec.type & this.objFlags.group)
					atype = "group";
				this.abort("register-duplicate", {name: name, type: type, another: atype})
			}
		},
		validateProps: function(desc, names, isbad){
			let propNames = this.splitTrim(names)
			let errors = [];
			let keys = Object.keys(desc);
			for(let k = 0; k<keys.length; k++){
				let pos = propNames.indexOf(keys[k]);
				if((isbad && pos >= 0) || (!isbad && pos < 0))
					errors.push(keys[k])
			}
			return errors.length > 0 ? errors : null;
		},
		typeDef: function(newtype, existing){
			if(newtype == existing)
				return;
			let rec = this.defstore[newtype];			
			if(rec)
				this.abort("typedef-duplicate", {name: newtype});
			rec = this.defstore[existing];
			if(rec === undefined)
				this.abort("typedef-unregistered", {name: newtype, which: existing})
			this.defstore[newtype] = rec.$def.InitNew(rec)
		},
		getDef: function(name, nothrow){
			let rec = this.defstore[name]
			if(!rec && !nothrow)
				this.abort("def-unregistered", {name: name})
			return rec ? rec.def : null;
		},
		equal: function(a,b,hard){
			if(hard){
				if(!a._jeepdef_ || !b._jeepdef_)
					return false;
				if(a._jeepdef_ !== b._jeepdef_)
					return false;
			}
			let v1 = this.splitVarFunc(a, true).vars;
			let v2 = this.splitVarFunc(b, true).vars;
			if(!v1 || !v2)
				return false;
			// _jeepdef_ is not needed for this operation
			v1._jeepdef_ = null;
			v2._jeepdef_ = null;
			return JSON.stringify(v1) == JSON.stringify(v2);
		},
		getPMCFlags: function(env, pmc, allowed){
			if(!pmc) return 0;
			let devmode = env.IsDevMode();
			if(typeof pmc !== "string"){
				if(devmode)
					this.addSyntaxError("pmc-nonstring", {})
				return 0;
			}
			let res = this.flagProc({flags: pmc, markError: devmode}, this.pmcFlagMap)
			if(res.errors.length > 0)
				this.addSyntaxError("pmc-unknown", {flags: res.errors.join(',')})
			if(devmode && allowed && (res.flags & ~allowed))
				this.addSyntaxError("pmc-invalid", {})
			return res.flags;
		},
		restrictedMembersExist: function(mem){
			if(!mem) return false;
			let keys = Object.keys(mem);
			for(let k = 0; k<keys.length; k++){
				let fi = mem[keys[k]];
				if(fi.decflags & (this.fxFlags.private|this.fxFlags.protected) || (fi.memAccessFlag > 1)){
					return true;
				}
			}
			return false;
		},
		constantMemExist: function(mem){
			if(!mem) return false;
			let keys = Object.keys(mem);
			for(let k = 0; k<keys.length; k++){
				let fi = mem[keys[k]];
				if(fi.decflags & this.fxFlags.constant)
					return true;
			}
			return false;
		},
		// info = {type, name, desc, defobj}
		createJeepDef: function(info, props){
			info.defobj.$name = info.name;
			info.defobj.$type = info.type;
			let jdef = null;
			if("record" == info.type)
				jdef = {					
					$name: info.name,
					$def: info.defobj,
					vars: null,
					ctor: info.desc.CONSTRUCTOR,
				}
			else if("struct" === info.type){
				info.type = "record";
				jdef = this.createJeepDef(info, {funcs: null})
			}
			else if("class" === info.type){				
				info.type = "struct";
				jdef = this.createJeepDef(info, {				
					constVars: null,
					vfuncs: null,
					baseVFuncs: null,
					staticMembers: null,
					staticSentinelRef: null,
					wrapFuncs: null,
					instBase: null,			
					ctorlist: [],
					dtor: info.desc.DESTRUCTOR,
					dtorlist: [],
					bases: info.desc.EXTENDS,
					flatBaseDefs: null,
					pmc: info.desc.PMC,// will be converted to number by the caller
					flags: 0,
					wrapperInits: [],// list of function(winfo = {inst, env, sentinel})
				})
			}
			if(props){
				let pkeys = Object.keys(props);
				for(let k = 0; k<pkeys.length; k++)
					jdef[pkeys[k]] = props[pkeys[k]]
			}
			return jdef;
		},
		testInitNew: function(env, other, varRef, errors){
			if(!varRef || Array.isArray(varRef) || (typeof varRef != "object"))
				return null;
			let devmode = env && env.IsDevMode();
			let vars = [];
			let keys = Object.keys(other);
			if(keys.length == 0)
				return null;// non object, fail fast
			for(let k = 0; k<keys.length; k++){
				let ky = keys[k];
				if(ky[0] == "$" || ky == "_jeepdef_")
					continue;
				// explicitly check for undefined since value can be zero, empty string etc which is also 'false'
				if(varRef[ky] === undefined){
					if(!devmode)
						return null;// fail fast
					errors.push(ky)
					continue;
				}
				vars.push(ky)
			}	
			return errors.length > 0 ? null : vars;
		},
		doInitNew: function(inst, other, vars){			
			for(let k = 0; k<vars.length; k++)
				inst[vars[k]] = this.cloneVariable(other[vars[k]])
		},
		// returns map of name and or'd decoration flags 
		undecorateFuncs: function(hint, env, funcs, name, flag){
			let undec = this.undecorateMem(hint, env, funcs, name, flag, (flag & this.fxFlags.static ? "static function" : "function"));
			let keys = Object.keys(undec);
			for(let k = 0; k<keys.length; k++){
				let ob = undec[keys[k]];
				ob.targs = null;// do always to maintain object shape
				if(ob.decflags & this.fxFlags.argtype){
					let afi = this.getArgFuncInfo(env, ob.item, keys[k]);
					if(afi){
						ob.targs = afi.args;
						ob.item = afi.func;
					}
				}
			}
			return undec;
		},
		// returns map of name and or'd decoration flags 
		undecorateVars: function(hint, env, vars, name, flag){
			return this.undecorateMem(hint, env, vars, name, flag, (flag & this.fxFlags.static ? "static variable" : "variable"));
		},
		// returns map of name and or'd decoration flags 
		undecorateMem: function(hint, env, items, name, flag, type){
			let devmode = !env || env.IsDevMode();
			let undec = this.undecorate(hint, env, items, type);
			let keys = Object.keys(undec);
			for(let k = 0; k<keys.length; k++){
				let ob = undec[keys[k]];
				ob.memAccessCode = 0;
				if(!(flag & this.fxFlags.static))
					ob.memAccessFlag = flag;
				else{
					if(ob.decflags & this.fxFlags.public)
						ob.memAccessFlag = this.fxFlags.public;
					else if(ob.decflags & this.fxFlags.protected)
						ob.memAccessFlag = this.fxFlags.protected;
					else if(ob.decflags & this.fxFlags.private)
						ob.memAccessFlag = this.fxFlags.private;					
				}
			}
			return undec;
		},
		// returns map of name and or'd decoration flags 
		undecorate: function(hint, env, items, type){
			let devmode = !env || env.IsDevMode();
			let res = {};
			if(!items) return res;
			let validate = env && env.IsDevMode();
			let keys = Object.keys(items);
			for(let k = 0; k<keys.length; k++){
				let undec = this.splitDecoration(env, type, keys[k]);
				if(!undec){
					if(devmode && (res[keys[k]] !== undefined))
						this.addSyntaxError("mem-dupname", {name: keys[k], type: type});
					res[keys[k]] = {item: items[keys[k]], decflags: 0};
					continue;
				}
				let flagStr = undec.decoration.split('_').join(",");// since FlagProcessor expects comma separated string
				let proc = "variable" == type  || "static variable" == type ? this.varDirectivesProc : this.funcDirectivesProc;
				let procres = proc.Process({markError: validate, flags: flagStr});				
				if(hint && validate){		
					for(let k = 0; k<procres.errors.length; k++)
						this.addSyntaxError("unknown-directive", {name: undec.name, type: type, invalid: procres.errors[k]});
					if(procres.errors.length == 0)
						if(!this.validateDirectives(hint, procres.flags, undec.name, type, items[keys[k]]))
							this.addSyntaxError("invalid-directive", {name: undec.name, type: type, invalid: flagStr});
				}
				if(devmode && (res[undec.name] !== undefined))
					this.addSyntaxError("mem-dupname", {name: undec.name, type: type});
				res[undec.name] = {item: items[keys[k]], decflags: procres.flags};
			}
			return res;
		},
		splitDecoration: function(env, type, decname){
			let name = decname;
			let pos = decname.indexOf('_');
			if(pos > 0){
				++pos;
				if(pos == decname.length)
					return null;
				if(decname[pos] !== '_')
					return null;
				++pos;
				if(pos == decname.length)
					return null;
				name = decname.substr(0, pos-2);
			}
			if(env && env.IsDevMode() && this.reservedWords.indexOf(name) >= 0)
				this.addSyntaxError("reserved-name", {name: name, type: type})
			return pos > 0 ? {name: name, decoration: decname.substr(pos)} : null
		},
		validateDirectives: function(hint, flags, name, type, item){
			switch(type){
				case "function":
					switch(hint){
						case "struct": 
							return flags & this.fxFlags.private;
						case "field":
							if(flags & (this.fxFlags.private|this.fxFlags.constant|this.fxFlags.abstract|this.fxFlags.virtual))
								this.addSyntaxError("field-directives", {func: name})
							break;
						case "group":
							return !(flags & (this.fxFlags.virtual|this.fxFlags.abstract));
						case "class":
							if((flags & this.fxFlags.virtual) && (flags & this.fxFlags.abstract))
								this.addSyntaxError("func-directive-combo", {name: name, combo: "virtual,abstract"});
							if((flags & this.fxFlags.argnum) && (flags & this.fxFlags.argnumvar))
								this.addSyntaxError("func-directive-combo", {name: name, combo: "argnum,argnumvar"});
							if(flags & this.fxFlags.abstract){
								if(!this.rxEmptyFunc.test(item.toString()))
									this.addSyntaxError("abstract-notempty", {name: name});
							}
							break;
					}
					break;
				case "variable":
					switch(hint){
						case "class": 
							return flags & (this.fxFlags.constant|this.fxFlags.setter|this.fxFlags.getter);
						case "struct": 
							return flags & this.fxFlags.private
					}
				case "static variable":
					return flags & (this.fxFlags.private|this.fxFlags.public);
				case "static function":
					let b = flags & (this.fxFlags.private|this.fxFlags.protected|this.fxFlags.public);
					return b && !(flags & (this.fxFlags.virtual|this.fxFlags.abstract|this.fxFlags.constant))
				case "constructor":
					if("struct" === hint)
						return true;
					if("group" === hint){
						if(flags != 0)
							this.addSyntaxError("invalid-ctor-directives", {});
					}
					else {
						if((flags != 0) && !(flags & (this.fxFlags.managed|this.fxFlags.protected|this.fxFlags.private)))
							this.addSyntaxError("invalid-ctor-directives", {});
						if((flags & this.fxFlags.protected) && (flags & this.fxFlags.private))
							this.addSyntaxError("invalid-ctor-directives-privprot", {});
						if((flags & this.fxFlags.managed) && (flags & this.fxFlags.private))
							this.addSyntaxError("invalid-ctor-directives-privmanaged", {});
					}
					break;
			}
			return true;
		},
		getDuplicates: function(a, b){
			if(!a || !b) return null;
			let dup = [];
			let keys = Object.keys(a);
			for(let k = 0; k<keys.length; k++){
				if(b[keys[k]] == a[keys[k]])
					dup.push(keys[k])
			}
			return dup.length > 0 ? dup : null;
		},
		merge: function(src, dest, propNames){
			if(!src) return;
			let keys = propNames||Object.keys(src);
			for(let k = 0; k<keys.length; k++){
				let dp = Object.getOwnPropertyDescriptor(src, keys[k]);
				if(dp && (dp.get || dp.set))
					Object.defineProperty(dest, keys[k], dp);
				else
					dest[keys[k]] = src[keys[k]]
			}
		},
		splitVarFunc: function(where, noimpl){
			let vars = {};
			let funcs = {};
			let v = 0, f = 0;
			let keys = Object.keys(where);
			for(let k = 0; k<keys.length; k++){
				let ky = keys[k];
				let ob = where[ky]
				if(typeof ob == 'function'){
					f++;
					funcs[ky] = ob;
				}
				else{
					if(noimpl && ky[0] == "$")
						continue;
					v++;
					vars[ky] = ob;
				}
			}
			return {vars: v ? vars : null, funcs: f ? funcs: null}
		},
		undecorateFuncArgs: function(env, args, fname){
			let devmode = env.IsDevMode();
			let res = [];
			let err = "";
			let arr = this.splitTrim(args);
			for(let k = 0; k<arr.length; k++){
				let undec = this.splitDecoration(env, "function argument", arr[k])
				if(!undec)
					res.push({vname: arr[k], tname: ""})
				else {
					let tarr = undec.decoration.split('_');
					if(devmode && tarr.length > 1){
						if(err)
							err += ",";
						err + undec.name;
					}
					else
						res.push({vname: undec.name, tname: tarr[0]})
				}
			}
			if(err.length > 0)
				this.addSyntaxError("argtype-types", {func: fname, args: err});
			let tcount = 0;
			for(let k = 0; k<res.length; k++){
				if(res[k].tname.length > 0)
					tcount++;
			}
			if(tcount === 0){
				this.addSyntaxError("argtype-notype", {func: fname});
				return null;
			}
			return res.length > 0 ? res : null;
		},
		cloneObject: function(ob){
			if(Array.isArray(ob))
				return Array.from(ob);
			let clone = {};
			let keys = Object.keys(ob);
			for(let k = 0; k<keys.length; k++){
				let dp = Object.getOwnPropertyDescriptor(ob, keys[k]);
				if(dp && dp.get && dp.set)
					Object.defineProperty(clone, keys[k], dp);
				else if(keys[k][0] === "$") 
					clone[keys[k]] = ob[keys[k]];
				else
					clone[keys[k]] = this.cloneVariable(ob[keys[k]])
			}
			return clone;
		},
		cloneVariable: function(v){
			if(Array.isArray(v))
				return Array.from(v);
			switch(typeof v){
				case "string": return v.repeat(1);
				case "object": return v ? this.cloneObject(v) : null;
			}
			return v;
		},
		addMembers: function(inst, def){
			if(!def) return;
			let keys = Object.keys(def);
			for(let k = 0; k<keys.length; k++)
				inst[keys[k]] = this.cloneVariable(def[keys[k]].item);
		},
		mergeMembers: function(inst, src){
			if(!src) return;
			let keys = Object.keys(src)
			for(let k = 0; k<keys.length; k++)
				inst[keys[k]] = src[keys[k]].item;
		},
		setAccessRestriction: function(inst, src, sentinel, commonAccess){
			if(!src) return;
			let impl = this;
			let keys = Object.keys(src)
			for(let k = 0; k<keys.length; k++){
				let ky = keys[k];
				let ob = src[ky];
				let flags = ob.decflags;
				let name = ob.$owner.$name + "." + ky;
				let type = (ob.memAccessFlag & impl.fxFlags.public) ? "public" : ((ob.memAccessFlag & impl.fxFlags.protected) ? "protected" : "private");
				let pubacc = ob.memAccessFlag & impl.fxFlags.public;
				let protacc = ob.memAccessFlag & impl.fxFlags.protected;
				if(typeof ob.item != 'function'){
					sentinel.obj[ky] = this.cloneVariable(ob.item);
					// Note: the 'allow' and 'restricted' flags, though common, cannot be declared outside the functions since
					// the closure mechanism on sentinel messes up everything.
					Object.defineProperty(inst, ky, {
						configurable: false,
						enumerable: true,
						set: function(v){
							let restricted = (sentinel.propFlags & impl.sentinelFlags.restrictedAccess) && sentinel.memAccessFlag.isSet();
							let otherInstAccess = (commonAccess.isSet() && sentinel.memAccessCode < 0);							
							let allow = pubacc || otherInstAccess || (restricted && (sentinel.internalAccess.isSet() || (sentinel.memAccessCode == ob.memAccessCode) || ((sentinel.memAccessCode >= 0) && protacc)));
							if(!allow){							
								if(sentinel.memAccessCode < 0 || ob.memAccessCode == sentinel.memAccessCode)
									impl.abort("restricted-access", {access: "write", spectype: type, memtype: "variable", name: name})
								else
									impl.abort("restricted-access-derived", {access: "write", spectype: type, memtype: "variable", name: name, trace: sentinel.getCallChain()})
							}
							if(sentinel.constFlag.isSet())
								impl.abort("const-func-change-detected", {name: name, trace: sentinel.getCallChain()})
							if((flags & impl.fxFlags.constant) && !sentinel.internalAccess.isSet()){
								let trace = sentinel.getCallChain();
								if(trace)
									impl.abort("const-var-set-detected", {name: name, trace: trace})
								else
									impl.abort("const-var-set-detected-ext", {name: name})
							}
							sentinel.obj[ky] = v;
						},
						get: function(){
							let restricted = (sentinel.propFlags & impl.sentinelFlags.restrictedAccess) && sentinel.memAccessFlag.isSet();
							let otherInstAccess = (commonAccess.isSet() && sentinel.memAccessCode < 0);							
							let allow = pubacc || otherInstAccess || (restricted && (sentinel.internalAccess.isSet() || (sentinel.memAccessCode == ob.memAccessCode) || ((sentinel.memAccessCode >= 0) && protacc)));
							if(!allow){							
								if(sentinel.memAccessCode < 0 || ob.memAccessCode == sentinel.memAccessCode)
									impl.abort("restricted-access", {access: "read", spectype: type, memtype: "variable", name: name})
								else
									impl.abort("restricted-access-derived", {access: "read", spectype: type, memtype: "variable", name: name, trace: sentinel.getCallChain()})
							}
							return sentinel.obj[ky];
						}
					})
				}
				else {
					sentinel.obj[ky] = ob.item;
					Object.defineProperty(inst, ky, {
						configurable: false,
						enumerable: true,
						set: function(v){
							if((sentinel.propFlags & impl.sentinelFlags.restrictedAccess) && !sentinel.internalAccess.isSet() && !commonAccess.isSet())
								impl.abort("restricted-access", {access: "overwrite", spectype: type, memtype: "function", name: name})
							sentinel.obj[ky] = v;
						},
						get: function(){
							if((sentinel.propFlags & impl.fxFlags.novirtual) && (flags & impl.fxFlags.virtual)){
								this.$novirtual = true;
								impl.abort("invalid-virtual-call", {fname: name, caller: sentinel.propFlags & impl.fxFlags.ctorcall ? "constructor" : "destructor"})
							}
							let restricted = (sentinel.propFlags & impl.sentinelFlags.restrictedAccess) && sentinel.memAccessFlag.isSet();
							let otherInstAccess = (commonAccess.isSet() && sentinel.memAccessCode < 0);
							let allow = pubacc || otherInstAccess || (restricted && (sentinel.internalAccess.isSet() || (sentinel.memAccessCode == ob.memAccessCode) || ((sentinel.memAccessCode >= 0) && protacc)));
							if(!allow){							
								if(sentinel.memAccessCode < 0 || ob.memAccessCode == sentinel.memAccessCode)
									impl.abort("restricted-access", {access: "invoke", spectype: type, memtype: "function", name: name})
								else
									impl.abort("restricted-access-derived", {access: "invoke", spectype: type, memtype: "function", name: name, trace: sentinel.getCallChain()})
							}
							return sentinel.obj[ky];
						}
					})
				}
			}
		},		
		splitTrim: function(t, c){
			return t.split(c?c:',').map(function(item){return item.trim()})
		},
		getErrorMessage: function(id, params){
			let m = this.fmtProcGet(id, params, this.preStructMsgMap);
			if(m === null)
				m = this.messages.Get(id, params);
			if(m === null)
				throw new Error("MessageFormatter could not format '"+id+"'");
			return m;
		},
		showWarning: function(id, params){
			let m = this.getErrorMessage(id, params);
			this.stderr("JEEP WARNING: "+m);
		},
		addSyntaxError: function(id, params){
			let m = this.getErrorMessage(id, params);
			this.errors.push(m);
		},
		abortOnSyntaxError: function(type, name){
			if(this.errors.length == 0) 
				return;
			this.stderr("JEEP: Compilation found "+this.errors.length+" error(s) for "+type+" '"+name+"'.");
			for(let k = 0; k<this.errors.length; k++)
				this.stderr((k+1)+". "+this.errors[k]);
			this.errors = [];// the client might catch and proceed foolishly, so lets be the wise ones
			throw "JEEP aborted."			
		},
		abort: function(id, params, exarr){
			let m = this.getErrorMessage(id, params)
			m = "JEEP: "+m;
			if(this.testing)
				throw m;
			m += " Aborting...";
			this.stderr(m);
			throw "JEEP aborted";
		},
		errorsPresent: function(){
			return this.errors.length > 0;
		},
		init: function(utils){
			if(this.fxFlags !== null) return;
			let impl = this;

			// setup utils and some internal informarion

			this.stderr = function(w){console.log(w)}

			utils.CopyProps = this.merge;

			utils.SplitTrim = this.splitTrim;

			utils.MakeSequence = function(id, fnames, env){
				let narr = this.SplitTrim(fnames);
				let devmode = env && env.IsDevMode();
				let ret = {};
				let err = "";
				for(let k = 0; k<narr.length; k++){
					if(devmode && (ret[narr[k]] !== undefined)){
						if(err.indexOf(narr[k]) < 0)
							err += ","+narr[k]
					}
					ret[narr[k]] = k;
				}
				if(err.length > 0)
					impl.abort("seq-flag-dupnames", {type: "sequence", fname: id, dupnames: err.substring(1)});
				return ret;
			}

			utils.MakeFlags = function(id, fnames, env){
				let narr = this.SplitTrim(fnames);
				let ret = {};
				let devmode = env && env.IsDevMode();
				if(devmode && (narr.length >= 32))
					impl.showWarning("flags-overflow", {fname: id});
				let flag = 1;
				let err = "";
				for(let k = 0; k<narr.length; k++){
					if(devmode && (ret[narr[k]] !== undefined)){
						if(err.indexOf(narr[k]) < 0)
							err += ","+narr[k]
					}
					ret[narr[k]] = flag;
					flag *= 2;
				}
				if(err.length > 0)
					impl.abort("seq-flag-dupnames", {type: "flag", fname: id, dupnames: err.substring(1)});
				return ret;
			}

			// create fxFlags before other objects since the intended objects need these flags for processing
			this.fxFlags = utils.MakeFlags(null, this.reservedWords + 
				"pmc_memaccess, pmc_constvars, pmc_constfuncs, pmc_argconst, pmc_argnum, pmc_argtype," + 
				"restrictedMem, restrictedStatic, constMemFuncs, constMemVars, protoFuncs, novirtual, ctorcall");

			this.envFlags = utils.MakeFlags(null, "trap_vcall");

			// make this an array for easier processing (indexOf on string will match substrings and the logic to process this is unnecessarily complex)
			this.reservedWords = this.reservedWords.split(',');

			// This map will be used when structure is not yet defined at the framework level, which obviously 
			// includes processing structure code itself, because utils.MessageProcessor is a structure.
			this.preStructMsgMap = this.fmtProcSetup({
				"seq-flag-dupnames": "The $type$ '$fname$' has repeated names '$dupnames$'.",
				"flags-overflow": "Generating 32 or more flags ($fname$) might cause overflow on your machine.",
				"initnew-fail": "The InitNew construction for the $type$ '$name$' failed due to unregistered names being mentioned [$errnames$].",
				"invalid-name": "The $type$ name '$name$' is invalid since it contains non alphanumeric characters.",
				"invalid-props": "$api$ was called with invalid property '$props$'.",
				"rec-extends-badarg": "The EXTENDS property should contain strings and record objects only.",
				"rec-extends-dupnames": "The variable '$bname$.$vname$' causes name clash upon extending the record.",
				"rec-extends-nodef": "The base record '$name$' to extend from is not registered.",
				"recstruct-novars": "The definition is invalid since it contains no variables.",
				"register-duplicate": "The $type$ '$name$' could not be registered since there exists a $another$ by the same name.",
				"struct-ctor-directives": "The constructor cannot take any directives",
				"struct-nofuncs": "The definition is invalid since it contains no functions.",
			})

			this.pmcFlagMap = {
				"pmc-constant-function": this.fxFlags.pmc_constfuncs, 
				"pmc-constant-variable": this.fxFlags.pmc_constvars, 
				"pmc-argconst": this.fxFlags.pmc_argconst, 
				"pmc-argnum": this.fxFlags.pmc_argnum, 
				"pmc-argtype": this.fxFlags.pmc_argtype, 
				"pmc-memaccess": this.fxFlags.pmc_memaccess,
			}

			utils.RecursiveFlag = this.createRecStructDef("", null, "RecursiveFlag", {
				CONSTRUCTOR: function(){this.counter = 0},
				add: function(){this.counter++},
				isSet: function(){return this.counter > 0},
				remove: function(){if(this.counter > 0) this.counter--},
				counter: 0,				
			});

			utils.ObjectIterator = this.createRecStructDef("", null, "ObjectIterator", {
				CONSTRUCTOR: function(obj){this.Reset(obj)},
				Reset: function(obj){
					if(typeof obj != "object" || Array.isArray(obj))
						obj = null;
					this.obj = obj;
					this.keys = obj ? Object.keys(obj) : null;
					this.pos = 0;
					this.pair = obj ? {} : null;
					if(obj && this.keys.length > 0 )
						this.pair = {key: this.keys[0],	value: this.obj[this.keys[0]]};
				},
				Total: function(){
					return this.keys ? this.keys.length : 0;
				},
				// returns true or false
				GetNext: function(){
					if(this.keys === null)
						return false;
					if(this.pos >= this.Total()){
						this.pair = null;
						return false;
					}
					let k = this.keys[this.pos];
					this.pair.key = k;
					this.pair.value = this.obj[k];
					this.pos++;
					return true;
				},
				GetCurrPair: function(){
					return this.pair;
				},
				GetCurrValue: function(){
					return this.pair ? this.pair.value : undefined;// undefined is better than null since thelatter is a valid value
				},
				GetCurrKey: function(){
					return this.pair ? this.pair.key : undefined;
				},
				obj: {},
				keys: [],
				pos: -1,
				pair: {},
			});

			utils.FlagProcessor = this.createRecStructDef("", null, "FlagProcessor", {
				CONSTRUCTOR: function(flagMap){
					this.flagMap = flagMap
				},
				flagMap: {},
				// info: {flags string, singleOnly bool, markError bool}
				Process: function(info){
					return impl.flagProc(info, this.flagMap)
				}
			});

			utils.MessageFormatter = this.createRecStructDef("", null, "MessageFormatter", {
				CONSTRUCTOR: function(map){
					this.theMap = impl.fmtProcSetup(map)
				},
				Get: function(id, tags){
					return impl.fmtProcGet(id, tags, this.theMap)
				},
				theMap: {},// msgid->{tag->{prefix}, tail}
			});			

			/**
			* use some utils to create some internal information
			**/

			// this is a one-time object, so no need for a definition; its peinstantiated of sorts
			this.managedStack = {
				arr: [],
				mark: function(){
					this.push(null);
				},
				isMarked: function(){
					return this.arr.length > 0;
				},
				push: function(obj, sentinel, staticSentinel, env, commonAccess){
					this.arr.push(obj ? {inst: obj, sentinel: sentinel, staticSentinel: staticSentinel, env: env, commonAccess: commonAccess} : null);
					this.pos = this.arr.length-1;
				},
				unwind: function(){
					while(this.arr.length){
						let pos = this.arr.length - 1;
						let rec = this.arr[pos];
						this.arr = this.arr.slice(0, pos);
						if(rec == null)
							break;
						let inst = rec.inst;
						let ex = impl.destroyInstance(inst, inst.$dindex, rec.sentinel, rec.staticSentinel, rec.commonAccess, rec.env);
						// abort at the first failure, let the developer fix things in sequence if more than one object engage in this abhorrent behavior.
						if(ex){
							// first clean the current stack frame
							while((pos > 0) && this.arr[pos])pos--;
							this.arr = this.arr.slice(0, pos-1);
							// now abort
							// first log existing exceptions if any to stderr before aborting with the relevant message
							if(inst.$ctorex){
								let m = impl.messages.Get("dtor-fail-ctor-failure", {name: inst.$name, ex: ex.message||ex, ctorex: inst.$ctorex.message||inst.$ctorex});
								impl.stderr("JEEP: "+m)
							}
							let msg = "";
							if(!(rec.sentinel.propFlags & impl.fxFlags.novirtual))
								msg = impl.messages.Get("destructor-failure", {name: inst.$name, ex: ex.message||ex})
							else 
								msg = impl.messages.Get("destructor-failure-novirtual", {name: inst.$name})
							impl.stderr("JEEP: "+msg)
							impl.abort("destructor-exception", {})
						}
					}					
				},
				reset: function(){
					this.arr = [];
				}
			};

			this.sentinelStruct = this.createRecStructDef("", null, "Sentinel", {
				propFlags: 0,// set during generation, based on env retain and function decflags
				memAccessCode: -1,// zero is for leaf class, hgher for base classes, -1 for nonmember
				fchain: "",//comma separated names of function using the sentinel
				memAccessFlag: impl.fx.Utils.RecursiveFlag.New(),
				constFlag: impl.fx.Utils.RecursiveFlag.New(),
				internalAccess: impl.fx.Utils.RecursiveFlag.New(),
				cvhash: null,
				obj: {},
				pushFunc: function(f){
					if(this.fchain)
						this.fchain += ",";
					this.fchain += f;
				},
				popFunc: function(){
					let i = this.fchain.lastIndexOf(',');
					if(i < 0)
						this.fchain = "";
					else
						this.fchain = this.fchain.substring(0, i);
				},
				getCallChain: function(){
					return this.fchain.length > 0 ? "["+this.fchain+"]" : null
				},
			});

			this.objFlags = utils.MakeFlags(null, "record, struct, class, field, group");

			this.objRecord = this.createRecStructDef("", null, "ObjRec", {def: null, type: 0}, true);

			this.libRecord = this.createRecStructDef("", null, "LibRec", {init: null, namespace: null, builders: []}, true);

			this.envFlagProc = utils.FlagProcessor.New({
				"trap-disabled-virtual-call": this.envFlags.trap_vcall, 
			})

			this.funcDirectivesProc = utils.FlagProcessor.New({
				"public": this.fxFlags.public, 
				"protected": this.fxFlags.protected, 
				"private": this.fxFlags.private, 
				"const": this.fxFlags.constant, 
				"argnum": this.fxFlags.argnum,
				"argnumvar": this.fxFlags.argnumvar,
				"argtype": this.fxFlags.argtype,
				"argconst": this.fxFlags.argconst, 
				"managed": this.fxFlags.managed,
				"virtual": this.fxFlags.virtual, 
				"abstract": this.fxFlags.abstract, 
			});

			this.varDirectivesProc = utils.FlagProcessor.New({
				"get": this.fxFlags.getter, 
				"set": this.fxFlags.setter,
				"const": this.fxFlags.constant,
				"public": this.fxFlags.public, 
				"protected": this.fxFlags.protected, 
				"private": this.fxFlags.private, 
			});

			this.sentinelFlags = utils.MakeFlags(null, "constant, restrictedAccess");

			this.messages = utils.MessageFormatter.New({
				"abstract-class": "The class '$name$' cannot be instantiated due to presence of unimplemented abstract functions '$absnames$'.",
				"abstract-notempty": "The abstract function '$name$' is defined.",
				"argconst--fail": "The function '$func$' modified its arguments ($args$) despite declaring them constant.",
				"argnum-fail": "The function '$func$' was invoked with wrong argument count (declared: $declared$, given: $given$).",
				"argtype-count": "The function '$func$' with the 'argtype' directive has mismatched argument count.",
				"argtype-fail": "The function '$func$' was invoked with wrong argument types '$args$'.",
				"argtype-names": "The function '$func$' with the 'argtype' directive has mismatched argument names.",
				"argtype-notype": "The function '$func$' with the 'argtype' directive should have at least one typed argument.",
				"argtype-syntax": "The function '$func$' with the 'argtype' directive doesn't have the correct function definition.",
				"argtype-types": "The function '$func$' with the 'argtype' directive declares multiple types for arguments ($args$).",
				"argtype-unreg": "The argument type '$type$' for the function '$func$' is unregistered.",
				"base-ctor-private": "The constructor is declared private in these base classes: '$bases$'.",
				"class-group-empty": "A $type$ should have $mem$.",
				"const-func-change-detected": "Attempt to change the variable '$name$' inside constant function detected. Call trace: $trace$.",
				"const-var-change-detected": "Attempt to change constant variables '$names$' detected. Call trace: $trace$.",
				"const-var-set-detected": "Attempt to change constant variable '$name$' detected. Call trace: $trace$.",
				"const-var-set-detected-ext": "Attempt to change constant variable '$name$' by non member function detected.",
				"constructor-failure-ex": "The class '$name$' could not be instantiated as the constructor raised the exception '$ex$'.",
				"constructor-failure-ret": "The class '$name$' could not be instantiated. Reason: $reason$.",
				"createinstance-dup": "Invalid CreateInstance since the class '$name$' is already instantiated.",
				"ctor-nomanage": "The constructor should be declared 'managed' since the base class does so.",
				"def-unregistered": "GetObjectDef for '$name$' failed since no object by that name was found.",
				"destructor-exception": "DESTRUCTOR THROWING EXCEPTION IS A SERIOUS STRUCTURAL ERROR.",
				"destructor-failure": "The instance of class '$name$' could not be destroyed as it raised the exception '$ex$'.",
				"destructor-failure-novirtual": "The instance of class '$name$' could not be destroyed since destruction was aborted due to invalid virtual function call.",
				"dtor-fail-ctor-failure": "The class '$name$' could not be instantiated as the constructor raised the exception '$ctorex$'. The partial destruction process also failed due to the exception '$ex$'.",
				"dtor-no-ctor": "A class cannot have a destructor without a constructor.",
				"field-directives": "The function '$func$' uses directives which are invalid for fields.",
				"field-group-dupnames": "The $type$ object already contains members with names '$dupnames$'.",
				"field-hasvars": "A field should consist only functions and not variables.",
				"field-nofuncs": "A field should consist atleast one function.",
				"field-unregistered": "The field '$name$' is not registered.",
				"func-directive-combo": "The function '$name$' has the directive combination '$combo$' set which is invalid.",
				"get-set-clash": "The function '$fname$' cannot be generated for the variable '$vname$' since a function by that name already exists.",
				"getinstance-args": "The function $name$.GetInstance does not expect any arguments.",
				"group-ctor-directives": "A group cannot have constructor with directives.",
				"hierarchy-dupname": "The $memtype$ '$name$' is found in multiple places in the hierarchy '$owners$'.",
				"initnew-moreargs": "The $type$ '$name$' was instantiated with InitNew with more than one argument meant for initialiation.",
				"initnew-noargs": "The $type$ '$name$' was instantiated with InitNew but without arguments meant for initialiation.",
				"inst-new": "$type$ '$name$' cannot be instantiated with the new operator. Use New or InitNew functions.",
				"invalid-builder-map": "The builder '$bname$' for the library '$libname$' invoked with $api$ was supplied wrong property '$props$'.",
				"invalid-ctor-directives": "Constructor can only have 'managed,protected,private' directive.",
				"invalid-ctor-directives-privmanaged": "Constructor cannot have both 'managed' and 'private' directives.",
				"invalid-ctor-directives-privprot": "Constructor cannot have both 'protected' and 'private' directives.",
				"invalid-directive": "The $type$ '$name$' uses invalid directive(s) '$invalid$'.",
				"invalid-env-desc": "CreateEnvironment should be given 'mode' and 'client' explicitly.",
				"invalid-env-prop": "CreateEnvironment was called with invalid $prop$ '$propval$'.",
				"invalid-virtual-call": "Invoking virtual function '$fname$' in the $caller$ detected.",
				"library-absent": "The builder '$bname$' could not be registered since the library '$name$' was not found.",
				"library-builder-absent": "The builder '$bname$' for the library '$libname$' was not found.",
				"library-duplicate": "Registering the library '$name$' failed since there is already a library by that name registered.",
				"library-unregistered": "Unable to get the library '$name$' since it is not registered.",
				"managed-dtor-absent": "Destructor should be defined for a class declared as 'managed'.",
				"managed-dtor-nomanage": "Destructor should be defined only for a class declared as 'managed'.",
				"managed-inst-location": "The class '$name$' is declared as managed and hence should be instantiated only within a call chain initiated by a managed function.",
				"mem-dupname": "The $type$ '$name$' is declared multiple times with different directives.",
				"member-multiple-acc": "The $type$ '$name$' is declared with multiple access restrictions.",
				"member-varfunc": "The member '$name$' is declared as both variable and function.",
				"namespace-flatten-duplicate": "The namespace cannot be flattened due to duplicate branch names ($names$).",
				"namespace-partition-duplicate": "The namespace already has these partitions '$parts$'.",
				"new-noctor": "Instantiation of $type$ '$name$' with New with arguments is invalid since there is no constructor. Use InitNew instead or define a constructor.",
				"pmc-invalid": "PMC contains invalid flags.",
				"pmc-nonstring": "PMC should be a comma separated string.",
				"pmc-unknown": "PMC contains unknown flag(s) '$flags$'.",
				"reserved-name": "The word '$name$' is reserved and hence cannot be used to declare a $type$.",
				"restricted-access": "Attempt to $access$ $spectype$ $memtype$ '$name$' detected.",
				"restricted-access-derived": "Attempt to $access$ base class $spectype$ $memtype$ '$name$' from derived class function detected. Call trace: $trace$.",
				"set-var-const": "The function '$fname$' cannot be generated for the variable '$vname$' since it is declared as constant.",
				"static-directives": "The static $type$ '$name$' uses invalid directives.",
				"typedef-duplicate": "The type '$name$' is already defined.",
				"typedef-unregistered": "The type '$name$' is being defined to unregistered object '$which$'.",
				"unknown-directive": "The $type$ '$name$' uses unknown directive(s) '$invalid$'.",
				"vfunc-args": "The virtual function '$fname$' is defined with different number of arguments in the hierarchy.",
				"vfunc-directives": "The virtual function '$fname$' is defined with different directives in the hierarchy.",
				"wrapper-dupnames": "The name '$name$' is present in both variable and function map.",
				"wrapper-instantiated": "The wrapper for the class '$name$' was instantiated. Wrappers are not meant to be used as instances.",
				"wrapper-map-value": "The $type$ map contains these non string values '$keys$'.",
				"wrapper-members-absent": "The class cannot be wrapped due to these missing $memtype$ '$mnames$'.",
				"wrapper-nodef": "CreateClassWrapper failed for '$name$' since the class is not registered.",
				"wrapper-nomap": "CreateClassWrapper failed for '$name$' since the definition has neither variable nor function map.",
			})
		},

		// private function accesd by the testing code, its this way since this function is useless for general clients
		clearForTest: function(){
			this.errors = [];
			this.namespaceCounter = 0;
			this.defstore = {};
			this.library = {};
			this.managedStack.reset();
		},

		createRecursiveFlag: function(){
			return {
				add: function(){this.counter++},
				isSet: function(){return this.counter > 0},
				remove: function(){this.counter--},
				counter: 0,
				obj: {}
			}
		},
		flagProc: function(info, flagMap){
			let flagArr = this.splitTrim(info.flags);
			let err = [];
			let flags = 0;
			let fc = 0;
			for(let k = 0; k<flagArr.length; k++){
				let d = flagArr[k];
				if(d.length == 0)
					continue;
				if(info.singleOnly && fc >= 1)
					return null;
				let t = flagMap[d];
				if(t !== undefined){
					flags |= t;
					fc++;
				}
				else if(info.markError)
					err.push(d);
			}
			return {errors: err, flags: flags}
		},
		// returns msgid->{tag->{prefix}, tail}
		fmtProcSetup: function(inMap){
			let outMap = {}
			let keys = Object.keys(inMap);
			for(let k = 0; k<keys.length; k++){
				let msg = inMap[keys[k]]
				let ky = keys[k];
				let t = ky[0];
				if(!((t >= 'A' && t <= 'Z')||(t >= 'a' && t <= 'z')))
					ky = ky.substring(1);
				else
					t = null;
				let mi = this.fmtProcSplit(msg, t);
				outMap[ky] = mi;
			}
			return outMap
		},
		fmtProcGet: function(id, tags, theMap){
			let fmt = theMap[id];
			if(fmt === undefined)
				return null;
			if(!tags)
				return fmt.tail;
			let msg = "";
			for(let k = 0; k<fmt.arr.length; k++){
				let p = fmt.arr[k];
				msg += p.prefix + tags[p.arg];// allow junk like undefined if tags are setup wrong, its callers fault
			}
			if(fmt.tail)
				msg += fmt.tail;
			return msg;
		},
		fmtProcSplit: function(msg, tagChar){
			tagChar = tagChar || "$"
			let arr = [];
			let pos = 0;
			while(true){
				let i = msg.indexOf(tagChar, pos);
				if(i < 0)
					break;// no more tags
				let j = msg.indexOf(tagChar, i+1);
				if(j < 0)
					break;// no tag end found, consider the char as part of the message
				let pref =  msg.substring(pos, i);
				let arg = msg.substring(i+1,j);
				arr.push({arg: arg, prefix: pref})
				pos = j+1;
			}
			let tail = "";
			if(pos != msg.length)
				tail = msg.substr(pos);
			return {arr: arr, tail: tail};
		},

		/*** data ***/

		// these are set in the init
		objFlags: null,
		fxFlags: null,
		objRecord: null,
		sentinelStruct: null,
		managedStack: null,
		stderr: null,
		funcDirectivesProc: null,
		varDirectivesProc: null,
		preStructMsgMap: null,

		errors: [],
		namespaceCounter: 0,
		rxEmptyFunc: /function\s*\([\w_,\s]*\)\s*\{\s*\}/,
		rxArgFuncSyntax: /function\s*(\w*)\s*\(([\w_$, ]*)\)\s*\{\s*return\s*function\s*\(([\w, ]*)\)\s*\{[\s\w\W]*\}\s*\}/,
		reservedWords: "public,protected,private,static,constant," + 
				"abstract,virtual,managed,argconst,argnum,argnumvar,argtype," + 
				"getter,setter,",// end with a comma so that flags are created properly
		defstore: {},
		library: {},
	}
}
