
//Creating the Vue object.
const rootComponent = {
  data() {
    return{
      pollingId: null,
      userInbox: {},
      selectedMail: null,
      readerID: null,
      mostrarCompo: false, //Tots els mostrar serveixen per decidir si mostrar un component o no mostrar-lo
      mostrarRead: false,
      mostrarForw: false,
      mostrarRep: false,
      AddressBook: {},
      userMail: null,

    }
  },

  mounted: function() {
    this.initAddressBook();
    this.refreshMailList();
  },

  beforeUnmount: function() {
    clearInterval(this.pollingId);
  },

  methods: {
    mostr: function() { //mostra el Composer
      this.hideAll();
      this.mostrarCompo = true;
    },

    reader: function(id){ //mostra el component mailReader
      this.hideAll();
      this.readerID = id;
      this.mostrarRead = true;
    },

    swi: function(id){ //Aquesta serveix per quan cliques a sobre d'un correu, decideixes amb aquest id que se li
      switch (id) {    //passa per parametre, si vols fer un reply, un forward o un delete i una vegada decidit
        case 'MF':     //et mostra un component o un altre component gràcies als booleans.
          this.hideAll();
          this.mostrarForw = true;
          break;
        case 'MR':
          this.hideAll()
          this.mostrarRep = true;
          break;
        case 'D':
          this.selectedMail=this.readerID.id;
          this.deleteMail();
          this.mostrarRead = false;
          break;
      }
    },

    hideAll: function(){ //Posa a false tots els components per tal de que no es mostri ni un
      this.mostrarForw = false;
      this.mostrarCompo = false;
      this.mostrarRead = false;
      this.mostrarRep = false;

    },

    botoRefrescar: function() { //Actualitza la safata d'entrada
      this.refreshMailList();
      this.hideAll();
    },
    
    sendMail: function(mail){ //Enviem el mail i utilitzem la funció per amagar tots els components

      fetch('/composedMail', {
        method: 'POST',
        headers:{
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mail),
      })
      .catch((error) => {
        console.error('Error:', error);
      });

      this.hideAll(); 
    },
        
    deleteMail: function(){
      fetch('/mail/'+this.selectedMail, {
        method: 'DELETE',
      })
      .then(response => response.json())
      .then(aJson => {console.log(aJson)}, this.refreshMailList())
      .catch(err => {
        console.error(err)});

    },

    resetDisplay: function() {
      this.pollingId = null;
      //a mida que es vagin creant variables es va afegint aqui
    },

    displayComponent: function(id){
      this.resetDisplay();
      this.pollingId = id;
    },

    refreshMailList: function(){
      fetch('/inbox').then(response => response.json()).then(aJson => {this.userInbox = aJson;});
    }, //Refresque la safata d'entrada on estan tots els correus 

    initAddressBook: function(){
      fetch('/addressBook').then(response => response.json()).then(aJson => {this.AddressBook = aJson;});
    }, //Inicialitzem les adreces de correu que existeixen i les posem a la variable AddressBook que després utilitzarem
       //per tal de poder escriure correus a gent que ja existeix de forma més fàcil.

  }, //end methods

  template:`
  <mail-list v-bind:inbox="userInbox" v-on:mos="mostr()" v-on:rea=reader($event) v-on:ref="botoRefrescar()" > </mail-list> <br>
  <div v-if= "mostrarCompo" > 
    <mail-composer v-bind:add = "AddressBook" :inbox="userInbox" v-on:New_mail=sendMail($event)> </mail-composer> 
  </div>
  <div v-if= "mostrarRead">
   <mail-reader v-on:fun="swi($event)" v-bind:int = "readerID"> </mail-reader>
  </div>
  <div v-if= "mostrarForw"> 
    <mail-forwarder v-bind:int = "readerID" :add = "AddressBook" v-on:New_mail=sendMail($event)> </mail-forwarder> 
  </div>
  <div v-if= "mostrarRep"> 
    <mail-replier v-bind:int = "readerID"  v-on:New_mail=sendMail($event)> </mail-replier> 
  </div>
  `
  /*
  Comentaris sobre el template:
    -El component mail-list no te cap div on hi hagi un boleea ja que és un component que es mostrarà tota l'estona
    i no hi ha d'haver res que ho amagi.
    En aquest component li passem els usuaris d'email que existeixen per tal de que amb el botó addressBook pugui mostrar-los
    També fem un v-on del rea que és la variable que cridarà a la funció reader que depenent del valor que se li passi per l'event
    mostrarà un component o en mostrarà un altre.
    -Després tenim el component del mail composer que li passem els emails que existeixen i també fem un v-on amb el New_mail ja que una vegada
    li doni al botó send, per l'event l'hi enviarà el mail i la safata d'entrada serà actualitzada
    -També tenim els components reader, forwarder i replier que tenen el readerID en comú que és l'objecte que mail que li passem per a que es
    mostri per pantalla 
  */
} //end options

//==== mail-list==============================================================

const mailListComponent = {
  name: "mail-list",

  methods:{
    compo: function() { //per mostrar el composer
      this.$emit('mos')
    },

    rea: function(id){  //per mostrar el reader junt amb l'objecte clicat
      console.log(id)
      this.$emit('rea', id);
    },

    refrescar: function(){
      this.$emit('ref');
    },

  },

  props: ['inbox'],

  template: `
  <button v-on:click = "compo()" > Compose </button>
  <div></div> <br>
  <div> INBOX </div>
  <ul>
    <li v-for="ind in inbox" v-on:click="rea(ind)"> {{ind.from}} :: {{ind.subject}} </li>
  </ul> <br>
  <button v-on:click="refrescar()"> Refresh </button>  <br>
  `
};

const mailReaderComponent = {	
  name: "mail-reader",
  methods:{
    disp: function(id){
      this.$emit("fun", id)
    }
  },

  props: ['int'],

  template:` 
  <div>
  <p><b>From: </b> {{int.from}} </p>
  <p><b>To: </b> {{int.to}} </p> 
  <p><b>Subject: </b> {{int.subject}} </p>
  <p><b>Body: </b> {{int.body}} </p>
  <button id="forward" @click="disp('MF')"> Forward </button>
  <button id="reply" @click="disp('MR')"> Reply </button>
  <button id="delete" @click="disp('D')"> Delete </button> 
  </div>
  `
};

const inputAddressComponent = {	
  name: "input-address",	
};

const mailComposerComponent = {	
  name: "mail-composer",
  data:function(){
    return{
      mostrarAdd: false,
      mailObj: {
        from: null,
        to: null,
        subject: null,
        body: null
      },
    }
  },

  methods:{
    show: function(){
      this.mostrarAdd = !this.mostrarAdd;
    },

    setEnviador: function(en){ //Assignem el to del mail ja que sempre en tots els mails que enviem seran desde el nostre mail
      this.mailObj.to = en;
      for (const [key, value] of Object.entries(this.inbox)) {
        this.mailObj.from = value.to;
      }
      this.mostrarAdd = false;
    },

    sendingThisMail: function(){
      this.$emit("New_mail", this.mailObj)
    },

  },

  props: ['add','inbox'],

  template: `
  <div>
  <p><b>To: </b> <input type="text" v-model="mailObj.to"> </p> <button v-on:click="show()"> Address Book </button>
    <div v-if="mostrarAdd">
      <ul>
        <li v-for="a in add" v-on:click="setEnviador(a)"> {{a}} </li>
      </ul>
    </div>
  <p><b>Subject: </b> <input v-model="mailObj.subject" type="text"></p>
  <p><b>Body: </b> <textarea v-model="mailObj.body"> </textarea></p>
  <button id="send" @click="sendingThisMail"> SEND </button>
  </div>
  `
};

const mailForwarderComponent = {	
  name: "mail-forwarder",	
  data: function(){
    return{
      mostrarAdd: false,
      mailObj: {
        from: this.int.to,
        to: null,
        subject: "Fw: " + this.int.subject,
        body: this.int.body
      },
    }
  },

  methods: {
    show: function(){ 
      this.mostrarAdd = !this.mostrarAdd;
    },

    setEnviador: function(en){ 
      this.mailObj.to = en;
      this.mostrarAdd = false;
    },

    sendingThisMail: function(){
      this.$emit("New_mail", this.mailObj)
    },

  },

  props:['int','add'],

  template: `
  <div>
  <p><b>From: </b> {{mailObj.from}} </p>
  <p><b>To: </b> <input type="text" v-model="mailObj.to"> </p> <button v-on:click="show()"> Address Book </button>
  <div v-if="mostrarAdd">
    <ul>
      <li v-for="a in add" v-on:click="setEnviador(a)"> {{a}} </li>
    </ul>
  </div>
  <p><b>Subject: </b> <input type="text" v-model=mailObj.subject> </p>
  <p><b>Body: </b> <textarea v-model= mailObj.body> </textarea> </p>
  <button id="send" @click="sendingThisMail"> SEND </button>
  </div>
  `
};

const mailReplierComponent = {	
  name: "mail-replier",	
  data: function(){
    return{
      mailObj: {
        from: this.int.to,
        to: this.int.from,
        subject: "Re: " + this.int.subject,
        body: this.int.body
      },
    }
  },

  methods: {
    sendingThisMail: function(){
      this.$emit("New_mail", this.mailObj) //enviem per la variable v-on New_mail i per l'event li passem this.mailObj que es el mail que volem enviar
    },

  },

  props:['int'],
  
  template: `
  <div>
  <p><b>From: </b> {{mailObj.from}}  </p>
  <p><b>To: </b> <input type="text" v-model=mailObj.to> </p> 
  <p><b>Subject: </b> <input type="text" v-model=mailObj.subject> </p>
  <p><b>Body: </b> <textarea v-model=mailObj.body> </textarea> </p>
  <button id="send" @click="sendingThisMail"> SEND </button>
  </div>
  `
};

const app = Vue.createApp(rootComponent);
app.component('mail-list', mailListComponent);
app.component('mail-reader', mailReaderComponent);
app.component('input-address', inputAddressComponent);
app.component('mail-composer', mailComposerComponent);
app.component('mail-forwarder', mailForwarderComponent);
app.component('mail-replier', mailReplierComponent);
const vm = app.mount("#app");