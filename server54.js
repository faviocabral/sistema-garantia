
const express = require('express'); 
const app     = express(); 
const bodyParser = require('body-parser'); 
const sql = require("msnodesqlv8"); 
const fs = require('fs'); 
const path = require('path'); 
const excelToJson = require('convert-excel-to-json'); 
const fileUpload = require('express-fileupload'); 
const moment = require('moment'); // require 
const { promiseImpl } = require('ejs'); 
const { resolve } = require('path'); 
const util = require('util'); 
const webpush = require('web-push'); 
const http = require('http');
var textract = require('textract');
var cors = require('cors')
const token = '1749166342:AAFfN_Da9T2bOni-zbt_BlyljlG8fM_VZ5Y'
const TeleBot = require('telebot');
const bot = new TeleBot(token);
const request = require('request')
var AdmZip = require("adm-zip")
var zip = new AdmZip()

bot.start();


//conexion del orm 
const knex = require("knex")({
    client: 'mssql',
    connection: {
      host : '192.168.10.160',
      port : 1433,
      user : 'sa',
      password : 'Sqlservices*',
      database : 'control'
    }
  });


//bot.sendMessage( chat_id = 1334412602, text = "http://www.google.com", parse_mode='HTML' );
//bot.sendMessage( 1767001034, 'Existe una Nueva Solicitud Nro 25 !!!');
//bot.sendMessage( 1798502059, 'prueba de servidor !!!');


/*inicializar las configuraciones de firebase */
var admin = require("firebase-admin");
var serviceAccount = require("C:/proyectos/apiSqlserver/garden-garantia-firebase-adminsdk-k1yvm-01163b3e55.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  serviceAccountId: 'firebase-adminsdk-k1yvm@garden-garantia.iam.gserviceaccount.com',
});
		

moment().format(); 
//const routes = require('./routes/index');
const viewDir = '${__dirname}/views';

app.set('views', viewDir),
app.set('view engine', 'ejs');

//app.use(express.static(process.cwd()+"/garantia/"));
app.use(express.static(path.join(__dirname, 'garantia')));
app.use(express.static(path.join(__dirname, 'manual_campanha')));
app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use((req, res, next)=>{
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Resquested-Width, Content-Type, Accept, Authorization');
    if(req.method === 'OPTIONS'){
        res.header('Access-Control-Allow-Methods', 'PUT, POST , PATCH, DELETE, GET');
        return res.status(200).json({});
    }
    next();
});
// default options
app.use(fileUpload());
app.use(cors())

//para dar un mensaje de bienvenida 
app.get('/campanha', (req, res , next)=>{
    //res.send('<h1 style="text-align:center; margin-top:100px;">SERVIDOR API REST <span style="background-color:#ef5350;color:white; border-radius: 8px;">GARDEN</span>!! 3010</h1>');
    res.sendFile(path.join(__dirname + '/index.html'));
});

//para dar un mensaje de bienvenida 
app.get('/stock/ve', (req, res , next)=>{
    //res.send('<h1 style="text-align:center; margin-top:100px;">SERVIDOR API REST <span style="background-color:#ef5350;color:white; border-radius: 8px;">GARDEN</span>!! 3010</h1>');
    res.sendFile(path.join(__dirname + '/stockVehiculos/index.html'));
    //res.send('<h1 style="text-align:center;">consulta stock </h1>');
});

//para dar un mensaje de bienvenida 
app.get('/stock/ge', (req, res , next)=>{
    //res.send('<h1 style="text-align:center; margin-top:100px;">SERVIDOR API REST <span style="background-color:#ef5350;color:white; border-radius: 8px;">GARDEN</span>!! 3010</h1>');
    res.sendFile(path.join(__dirname + '/stockVehiculos/index.html'));
    //res.send('<h1 style="text-align:center;">consulta stock </h1>');
});

//para dar un mensaje de bienvenida 
app.get('/nissan', (req, res , next)=>{
    //res.send('<h1 style="text-align:center; margin-top:100px;">SERVIDOR API REST <span style="background-color:#ef5350;color:white; border-radius: 8px;">GARDEN</span>!! 3010</h1>');
    res.sendFile(path.join(__dirname + '/index2.html'));
});

//para dar un mensaje de bienvenida 
app.get('/chat', (req, res , next)=>{
    //res.send('<h1 style="text-align:center; margin-top:100px;">SERVIDOR API REST <span style="background-color:#ef5350;color:white; border-radius: 8px;">GARDEN</span>!! 3010</h1>');
    res.sendFile(path.join(__dirname + '/index3.html'));
});

//sistema de seguro - seguimiento  
app.get('/seguro', (req, res , next)=>{
    //res.send('<h1 style="text-align:center; margin-top:100px;">SERVIDOR API REST <span style="background-color:#ef5350;color:white; border-radius: 8px;">GARDEN</span>!! 3010</h1>');
    res.sendFile(path.join(__dirname + '/presupuesto.html'));
	console.log(path.join(__dirname + '/presupuesto.html'));
});

//sistema de seguro - seguimiento 
app.get('/garantia/*', (req, res , next)=>{ 
	//direccionamiento para app de angular 
	//https://medium.com/bb-tutorials-and-thoughts/how-to-develop-and-build-angular-app-with-nodejs-e24c40444421
	//https://stackoverflow.com/questions/5973432/setting-up-two-different-static-directories-in-node-js-express-framework
	res.sendFile(path.join(__dirname + '/garantia/index.html')); 
});

app.get('/nube', (req, res , next)=>{ 
	//direccionamiento para app de angular 
	//https://medium.com/bb-tutorials-and-thoughts/how-to-develop-and-build-angular-app-with-nodejs-e24c40444421
	//https://stackoverflow.com/questions/5973432/setting-up-two-different-static-directories-in-node-js-express-framework
	
	res.sendFile(path.join(__dirname + '/angular-crud-firebase/index.html')); 
});

app.get('/garantia', (req, res , next)=>{ 
	//https://www.youtube.com/watch?v=8ptiZlO7ROs&t=140s
	//direccionamiento para app de angular 
	//https://medium.com/bb-tutorials-and-thoughts/how-to-develop-and-build-angular-app-with-nodejs-e24c40444421
	//https://stackoverflow.com/questions/5973432/setting-up-two-different-static-directories-in-node-js-express-framework
	
	res.sendFile(path.join(__dirname + '/garantia/index.html')); 
});

app.get('/manual-campanha', (req, res , next)=>{
    //res.send('<h1 style="text-align:center; margin-top:100px;">SERVIDOR API REST <span style="background-color:#ef5350;color:white; border-radius: 8px;">GARDEN</span>!! 3010</h1>');
    res.sendFile(path.join(__dirname + '/manual_campanha/manual.html'));
	//console.log(path.join(__dirname + '/presupuesto.html'));
});


//The 404 Route (ALWAYS Keep this as the last route)
// app.get('*', function(req, res){
//     res.status(404).send('<center><h1>Pagina no encontrada !!!</h1></center>');
//   });


app.post('/garantia-push',(req, res)=>{ 
	if(!req.body) return res.sendStatus(400); 
	var datos = req.body; 
	console.log(datos);
	
	var message = {
		notification: {
		   title: datos.titulo, 
		   body: datos.mensaje  
		}, 
		token: 'cPVPkLK0GQA970DKo-2DT3:APA91bFEir4zvvV5SD3sWN4iPFdhalk7jTOn7BkoxgetxuKJlH_sbOLDrdjlLcw9PfYbivU4ER3UAc3iK84pWItgErmaZx4UX7QFgKXHTo3w695-aWCpfYZc_Iwc_a_VdlyW6D09TiIH'
	};
	//'cPVPkLK0GQA970DKo-2DT3:APA91bFEir4zvvV5SD3sWN4iPFdhalk7jTOn7BkoxgetxuKJlH_sbOLDrdjlLcw9PfYbivU4ER3UAc3iK84pWItgErmaZx4UX7QFgKXHTo3w695-aWCpfYZc_Iwc_a_VdlyW6D09TiIH'
	// Send a message to the device corresponding to the provided
	// registration token.
	admin.messaging().send(message) 
	.then((response) => {
		// Response is a message ID string.
		console.log('Successfully sent message:', response);
		res.sendStatus(200);
	})
	.catch((error) => {
		console.log('Error sending message:', error);
		res.sendStatus(400);
	});	
	
});

// VAPID keys should only be generated only once.
//const vapidKeys = webpush.generateVAPIDKeys();
const publicVapidKey = 'BH2aGsR4IIyP1UWs-ERaFftJqLgKoF_eurAbzpOv2VYjydjgR5tQBIW6TcyAPAnLHv2nY4mGZ3hdV0hlZC6IGNg';
const privateVapiKey = 'hXz1dDbQgi-MTmbglzKCn8qYPAQvxo3dq3p2nq8giNw';
//console.log(vapidKeys);

webpush.setVapidDetails('mailto:test@test.com', publicVapidKey, privateVapiKey);

app.post('/subscribe', (req, res) =>{
	const subscription = req.body 
	//send 201 creado 
	res.status(201).json({});
	
	//create payload 
	const payload = JSON.stringify({title: 'push test'});
	
	//pass the object noti.. 
	webpush.sendNotification(subscription, payload).catch(err => console.error(err));              
});


//conexion a la base datos. 
const connectionString  = "Driver={ODBC Driver 11 for SQL Server};server=192.168.10.160;Database=GardenKia;UID=sa;PWD=Sqlservices*;";
const connectionString2 = "Driver={ODBC Driver 11 for SQL Server};server=192.168.10.3;Database=Master;UID=sa;PWD=1234567;";

bot.on(['/start'], (msg) => {
	console.log(msg);
	console.log('chat id: ', msg.chat.id);
	console.log('nombre : ', msg.chat.first_name);
	console.log('apellido : ', msg.chat.last_name);
	console.log('user : ', msg.chat.username);
	msg.reply.text('Bienvenido al Sistema Notificacion de Garantia!!');

	//esta linea envia un mensaje de telegram a chan para saber quien se conecto al bot !! 
	bot.sendMessage( 1334412602, 'Nuevo Usuario se unio al bot de Garden \n chat_id= '+ msg.chat.id + "  \n nombre: " + msg.chat.first_name + " apellido: " + msg.chat.last_name +" \n usuario: "+ msg.chat.username );
    const query = " if Not exists( select 1 from control.dbo.telegram_users where chat_id = "+ msg.chat.id +") "+
				  " begin "+
				  " insert into control.dbo.telegram_users (chat_id , first_name, last_name , username ) "+ 
				  " select "+ msg.chat.id +", '"+ msg.chat.first_name +"', '"+ msg.chat.last_name +"', '"+ msg.chat.username +"' "+
				  " end ";
    sql.query(connectionString, query, (err, rows) => {
        if(err){
            console.log(err);
        }
		//console.log('se inserto registro en telegram_users... ');
        //console.log(rows);
        //res.status(200).json({
        //    rows
        //});
    });
	
	
});

let sender =[] //variable global para control de ins de fotos con ot 
bot.on(['text', 'photo', 'video'] , async(msg)=>{
    
    console.log(msg)

    if(msg.hasOwnProperty('photo') || msg.hasOwnProperty('video')){
        if(sender.findIndex(item => item.from = msg.from.id) < 0)//si no existe en la lista agregar 
            sender.push({from: msg.from.id, estado: 'ok'})


        if( (msg.hasOwnProperty('photo') === true || msg.hasOwnProperty('video') === true) && msg.hasOwnProperty('caption') === false && msg.hasOwnProperty('media_group_id') === false){
            bot.sendMessage(msg.chat.id, `${msg.from.first_name}, enviaste una imagen sin el nro de la ot, por favor adjunta el nro de OT con tu imagen gracias !!`)
        }else{

            if(msg.hasOwnProperty('caption')){
                if(!!parseInt(msg.caption)){

                    try {
                        await knex()
                            .select()
                            .from('gardenkia.dbo.oscl')
                            .where('callid', parseInt(msg.caption) )
                            .whereIn('status', ['3','-3', '2'])
                            .then(row => {
                                console.log('registro del control ot', row)
                                if(row.length === 0){
                                    control = 1 
                                    bot.sendMessage(msg.chat.id, `${msg.from.first_name}!, el nro de OT ${msg.caption} esta cerrada o no corresponde, favor ingrese de vuelta las imagenes con el nro de OT correcto gracias`) 
                                    sender.find(item => item.from === msg.from.id).estado = 'no'
                                    return 
                                }else{
                                    sender.find(item => item.from === msg.from.id).estado = 'ok'
                                }
                            })
                    } catch (error) {
                        console.log('hubo un error con el control de ot y fotos', error)
                        return                  
                    }
                }else{
                    sender.find(item => item.from === msg.from.id).estado = 'no'
                    bot.sendMessage(msg.chat.id, `${msg.from.first_name}!, el nro de OT ${msg.caption} no corresponde, favor ingrese de vuelta las imagenes con el nro de OT correcto gracias`)
                    return 
                }
            }

            if(sender.find(item => item.from === msg.from.id).estado === 'ok' ){//solo si la ot es valida debe ingresar las imagenes
                let valor = {
                    chatId: msg.chat.id,
                    messageId: msg.message_id,
                    fromId: msg.from.id,
                    fromName: msg.from.first_name +' ' + msg.from.last_name,
                    mediaGroupId: msg.media_group_id || null,
                    fotoId: msg.photo.at(-1).file_id || null,
                    caption: msg.caption?.trim() || null 
                }
                try {

                    await knex()
                    .insert(valor)
                    .into('solicitudGar_fotos')
                    .then(async (e) =>{
                        console.log('se guardo los datos con exito' , e )
                        if(msg.hasOwnProperty('caption')){
                            bot.sendMessage(msg.chat.id, `Gracias ${msg.from.first_name}!, las imagenes fueron vinculadas con la OT ${msg.caption}`)
                        }
                        if(msg.hasOwnProperty('caption') === false && msg.hasOwnProperty('media_group_id') === true){
                            try {
                                await knex.raw(`
                                    update solicitudGar_fotos
                                    set caption = t2.caption
                                    from solicitudGar_fotos inner join solicitudGar_fotos t2 on solicitudGar_fotos.mediaGroupId = t2.mediaGroupId and t2.caption is not null 
                                    where solicitudGar_fotos.mediaGroupId = '${msg.media_group_id}'
                                `)
                                .then(e =>{
                                    console.log('ok caption actualizado !')
                                })
                            } catch (error) {
                                console.log('error al actualizar el caption ', error)                        
                            }
                        }
        
                    })
                    
                } catch (error) {
                    console.log('hubo un error al guardar en la base datos ', error)
                }  
            }

        }
    }
})


//telegram
app.get('/telegram-users',(req, res, next)=>{
    const query = "SELECT * FROM control.dbo.telegram_users ";
    sql.query(connectionString, query, (err, rows) => {
        if(err){
            console.log(err);
        }
        //console.log(rows);
        res.status(200).json({
            rows
        });
    });
});

app.get('/telegram-send',(req, res, next)=>{
	const chat_id = req.query.chat_id;
	const mensaje = req.query.mensaje;
    bot.sendMessage( chat_id, mensaje,{parse_mode:'HTML'});
        res.status(200).json({
			'ok': 'Mensaje enviado !!'
		})
});


app.get('/servidor170', (req , res , next )=>{
    /**para correr sercicios externos... */
    var options = {
        host: '192.168.10.170',
        port: 3010,
        path: '/servidor',
        method: 'GET'
      };

    http.get(options, function(resp){
        resp.on('data', function(chunk){
          //do something with chunk
          res.status(200).json({
              'servidor': 'se reinicio...' + moment().format(" hh:mm:ss")
          });
        });
      }).on("error", function(e){
        console.log("Got error: " + e.message);
      });
});  


app.get('/rrhh', (req , res , next )=>{
    var archivo = req.query.archivo;
    textract.fromFileWithPath('./uploads/'+ archivo +'.docx', {preserveLineBreaks: true}, function( error, text ) {
        //console.log(text);
        var nuevo = text.split('\n');
        res.status(200).json({nuevo})
    })
});  




app.get('/servicios',(req, res, next)=>{
    const query = "SELECT  * FROM gardenkia.dbo.oscl with(nolock) where createdate >= '20200501' ";
    sql.query(connectionString, query, (err, rows) => {
        if(err){
            console.log(err);
        }
        //console.log(rows);
        res.status(200).json({
            rows
        });
    });
});

///// consulta y insercion para postventa promociones formulario de la pagina web kia pedido de ever mkt
app.get('/postventa-consulta',(req, res, next)=>{
    const query = "SELECT * FROM control.dbo.postventa_promociones ";
    sql.query(connectionString, query, (err, rows) => {
        if(err){
            console.log(err);
        }
        //console.log(rows);
        res.status(200).json({
            rows
        });
    });
});


///// consulta y insercion para postventa promociones formulario de la pagina web kia pedido de ever mkt
app.get('/stock-vehiculos',(req, res, next)=>{
    var marca = req.query.marca; 
    var modelo = req.query.modelo; 
    //const query = `select * from control.dbo.v_stockVehiculos where marca = '${marca}' and case when '${modelo}' = 'todos' then 'todos' else  modelo end  = '${modelo}' `;
    const query = 
    `select t1.marca, upper(T1.modelo) as modelo, version, color, sum(cantidad) cantidad 
    from control.dbo.v_stockVehiculos t1 
    where  marca = '${marca}' 
    group by t1.marca , T1.modelo , version , color ` 

    /* 
    `select t1.marca , T2.mc_desc_modelo as modelo, version , color , sum(cantidad) cantidad 
    from control.dbo.v_stockVehiculos t1 
    inner join BASE_BI.dbo.Modelo_consolidado t2 
        on t1.modelo = t2.mc_desc_modelo collate Modern_Spanish_CI_AS 
        and t1.empresa = t2.mc_empresa collate Modern_Spanish_CI_AS 
    where  marca = '${marca}'
    and case when '${modelo}' = 'todos' then 'todos' else  t2.mc_Cons_Modelo end  = '${modelo}'
    group by t1.marca , T2.mc_desc_modelo , version , color  `
    */

    sql.query(connectionString, query, (err, rows) => {
        if(err){
            console.log(err);
        }
        //console.log(rows);

        //filtramos los modelos de kia 
        rows = rows.map(item => {
            return {
                marca : item.marca,
                modelo: item.modelo.replace(/NQ5|MQ4|QY|SP2i|KY|KA4|JA|SG2|PU|SC|SP2I|-Z52|-P15|- H60-D23|- N18|\(|\)/g, '').trim() , //filtro de kia
                version: item.version.replace(/PE\(|\)/g, '') 
                                        .replace("A/T 1.2T", 'AT 1.2T').trim() // filtro de tema 
                                        .replace("*", '').trim(), // filtro de tema 

                color: item.color,
                cantidad: item.cantidad
            }
        })        

        res.status(200).json({
            rows
        });
    });
});

app.get('/marca-modelo', (req, res , next )=>{
    var marca  = req.query.marca; 
    //const query = `select  marca , modelo from control.dbo.v_stockVehiculosMarcaModelo where marca = '${marca}' `;
    const query = 
    `select distinct t1.marca , t2.modelo_generico as modelo    
    from control.dbo.v_stockVehiculos t1 
    left outer join (select distinct 
                        mc_desc_modelo modelo,
                        mc_Cons_Modelo modelo_generico 
                        from BASE_BI.dbo.Modelo_consolidado) t2 on t1.modelo = t2.modelo collate Modern_Spanish_CI_AS
    where  marca = '${marca}'`;    

    sql.query(connectionString, query, (err, rows) => {
        if(err){
            console.log(err);
        }
        //console.log(rows);
        res.status(200).json({
            rows
        });
    });
});




app.post('/postventa-promociones',(req, res)=>{ 
	console.log(req.body); 
	if(!req.body) return res.sendStatus(400); 
	var datos = req.body; 
	console.log('datos del formulario postventa ... ', datos);	
	var query = " insert into control.dbo.postventa_promociones (nombre , apellido , email, telefono, ciudad , modelo_anho , comentarios , tipo_servicio ) select '"+ datos.nombre + "', '"+ datos.apellido + "', '"+ datos.email + "', '"+ datos.telefono + "', '"+ datos.ciudad + "', '"+ datos.modelo_anho + "', '"+ datos.comentarios + "', '"+ datos.tipo_servicio + "' "  ;
	sql.query(connectionString, query, (err, rows) => {
		if(err){
			console.log(err);
			res.status(404).send(err);
		}
		res.sendStatus(201).end();
	});
});

///////////////////////////////////////////////////////////////



app.post('/upload/:sucursal', function(req, res) {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).send('No files were uploaded.');
    }
    var sucursal = req.params.sucursal;

    console.log(req.files);
    // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
    var sampleFile = req.files.file;
    // Use the mv() method to place the file somewhere on your server

    sampleFile.mv('./uploads/' + sucursal + '.xlsx', function(err) {
      if (err)
        return res.status(500).send(err);
      res.status(201).send('File uploaded!');
    });
  });
  

  app.get('/entrega-pagares',(req, res)=>{ 
	console.log(req.body); 
    var contrato = req.query.contrato;
	if(!req.body) return res.sendStatus(400); 
    if(contrato == '*' ){ contrato = ''; }

	var query = " select contrato, cuota, quienretira, cedula, telefono, reciboObservaciones , fechaentrega from control.dbo.entregapagares_aux where ( contrato like '%" + contrato + "%' or cuota like '%" + contrato + "%')"  ;
	sql.query(connectionString, query, (err, rows) => {
		if(err){
			console.log(err);
			res.status(404).send(err);
		}
        console.log(req.ip);
        res.status(200).json({
            rows
        });
	});
});


app.get('/pagares',(req, res)=>{ 
	console.log(req.body); 
    var contrato = req.query.contrato.replaceAll(' ', '%');
	if(!req.body) return res.sendStatus(400); 
    if(contrato == '*' ){ contrato = ''; }
	var query = " select fecha , cliente, nroContrato, nroCuota, referencia, cuotas, referencia2 , firma , id from control.dbo.entregapagares_aux2 where ( nroContrato like '%" + contrato + "%' or fecha like '%"+ contrato +"%' or cliente like '%"+ contrato +"%' )"  ;
    console.log(query)
	sql.query(connectionString, query, (err, rows) => {
		if(err){
			console.log(err);
			res.status(404).send(err);
		}
        console.log(req.ip);
        res.status(200).json({
            rows
        });
	});
});

app.get('/pagares-id',(req, res)=>{ 
	console.log(req.body); 
	if(!req.body) return res.sendStatus(400); 
    var id = req.query.id;

	var query = " select fecha , cliente, nroContrato, nroCuota, referencia, cuotas, referencia2 , firma , id from control.dbo.entregapagares_aux2 where id = " +  String(id) ;
	sql.query(connectionString, query, (err, rows) => {
		if(err){
			console.log(err);
			res.status(404).send(err);
		}
        console.log(req.ip);
        res.status(200).json({
            rows
        });
	});
});

app.post('/pagares-ins',(req, res)=>{ 
	console.log(req.body); 
    const {fecha , nroContrato, nroCuota, cuotas , referencia , referencia2 , firma, cliente} = req.body
	if(!req.body) return res.sendStatus(400); 
    try {
        var query = `insert into control.dbo.entregapagares_aux2 ( fecha , cliente, nroContrato, nroCuota, referencia, cuotas, referencia2 , firma) values('${fecha}','${cliente}','${nroContrato}','${nroCuota}','${referencia}','${cuotas}','${referencia2}','${firma}')` ;
        console.log(query)
        sql.query(connectionString, query, (err, rows) => {
            if(err){
                console.log(err);
                res.status(404).send(err);
            }
            console.log(req.ip);
            res.status(200).json({
                rows
            });
        });
    } catch (error) {
        console.log(error);
        res.status(404).send(error);
    }
});


app.put('/pagares-upd',(req, res)=>{ 
	console.log(req.body); 
    const datos = req.body
    const id = req.query.id 
	if(!req.body) return res.sendStatus(400); 
    try {

        knex('entregapagares_aux2')
        .where('id', id)
        .update(datos)
        .then((e)=>{
            console.log('se actualizo los datos de pagares  ',e)
            res.status(200).json({ message: 'ok' });
        })
    } catch (error) {
        console.log(error);
        res.status(404).send(error);
    }
});

app.delete('/pagares-del',(req, res)=>{ 
	if(!req.query.id) return res.sendStatus(400); 
    const id = req.query.id 
    try {

        knex('entregapagares_aux2')
        .where('id', id)
        .del()
        .then((e)=>{
            console.log('se borro los datos de pagares  ',id)
            res.status(200).json({ message: 'ok' });
        })
    } catch (error) {
        console.log(error);
        res.status(404).send(error);
    }
});




app.get( '/taller-fca',(req, res, next)=>{
    /*
    var hoja = String(moment().format('DD-MM'));
    var result = excelToJson({
        source: fs.readFileSync('./uploads/taller-fca.xlsx' ), // fs.readFileSync return a Buffer
        header:{ rows: 1 }, 
        columnToKey: { '*': '{{columnHeader}}' },
        sheets: [hoja]

    });
    */
    const query = `
                    SELECT distinct TOP 80
                    case 
                        when T1.STATUS = -1 or TECNICO IS NOT NULL and tecnicos.codigoEstado = -3 then 'TE'  
                        when TECNICO IS NULL then 'EE'  
                        when TECNICO IS NOT NULL and tecnicos.codigoEstado in ( -2 , 2, 3)  then 'EE' 
                        when TECNICO IS NOT NULL and tecnicos.codigoEstado = 1 then 'ES'  
                    end AS STATUS,
					CASE 
						WHEN t1.U_Tipo in (6) then 'usoTaller'
						WHEN t1.callType in (1) then 'express'
						WHEN t1.callType in (5) then 'cliente Espera'
						WHEN t1.callType in (3,4) then 'reparacion'
						WHEN t1.callType in (2) then 'reIngreso'
						WHEN t1.callType in (9) then 'garantia'
						WHEN t1.callType in (7) then 'campanha'
						else 'otros'
					end  TIPO_SERVICIO,

                    callID 'NRO SERVICIO',
                    CONVERT(VARCHAR(100), t1.createDate,5 ) FECHA, 
                    right( '0' + CASE WHEN LEN(createTime) = 3 THEN STUFF( createTime , 2, 0 ,':') ELSE STUFF(createTime, 3, 0 , ':') END , 5) HORA, 
                    left( convert(varchar(100), t2.fecha_promesa, 114),5)  PROMESA,
                    Room CONO,
                    upper(left(t5.U_NAME, 7)) ASESOR,
                    custmrName CLIENTE,
                    t1.itemName VEHICULO,
                    Street CHAPA,
                    t4.name COLOR,
                    lower( LEFT( subject, 36)+'..')  MOTIVO,
                    isnull(tecnicos.TECNICO,'') TECNICO
                    FROM gardenkia.dbo.OSCL t1 with(nolock)
                        inner join control.dbo.ot_tablet t2 with(nolock) on t1.callID = t2.ot
                        inner join gardenkia.dbo.oitm t3 with(nolock) on t1.itemCode = t3.ItemCode 
                        inner join gardenkia.dbo.[@COLOR] t4 on t3.U_Color = t4.Code 
                        inner join gardenkia.dbo.OUSR t5 with(nolock) on t1.assignee = t5.USERID 
                        left outer join ( select  T6.parentid OT, UPPER( LEFT( t7.U_NAME , 6)) TECNICO, T8.name ESTADO  , t8.statusID codigoEstado
                                            from gardenkia.dbo.OCLG t6 with(nolock)
                                                inner join gardenkia.dbo.OUSR t7 with(nolock) on t6.AttendUser = t7.USERID 
                                                inner join gardenkia.dbo.ocla t8 with(nolock) on t6.status = t8.statusID 
                                        ) tecnicos on t1.callID = tecnicos.OT  
                    WHERE U_Sucursal = 'ALIDER'
                    and t1.callID in ( select callid 
                                        from gardenkia.dbo.oscl with(nolock) where U_Sucursal = 'alider' 
                                        and ( createDate = convert(varchar(100), getdate(), 112) 
                                              or closedate = convert(varchar(100), getdate(), 112) 
                                              or (createDate < convert(varchar(100), getdate(), 112)  and status = -3 ) 
                                            )
                                    )
                    and datediff(month, t1.createDate , getdate() ) < 6                                     
                    --order by t1.createDate desc 
    `
	sql.query(connectionString, query, (err, rows) => {
        var listado=[];
		if(err){
			console.log(err);
			res.status(404).send(err);
		}
        try {


            listado = Object.values(rows || {}) ;
            var cabecera = Object.keys(listado);
            console.log(listado.length);
            console.log(req.ip);
        } catch (error) {
            console.log(error);
        } 
    
        res.status(200).json({
            rows : listado 
        });
	});


/*	
	var listado = Object.values(result);
	var cabecera = Object.keys(listado[0][0]);
	console.log(listado.length);
    console.log(req.ip);

*/  /*
	var query="" ;
	var i;
	for (i = 0; i < listado.length; i++) {
		if (listado[i].length){
		console.log( ' filas ', listado[i].length);
			
			var k;
			for (k = 0; k < listado[i].length; k++) {
				listado2.push({
					'Contrato': listado[i][k]['CONTRATO'],
					'cuota': listado[i][k]['CUOTA'], 
					'QuienRetira': listado[i][k]['QUIEN RETIRA'],
					'Cedula': listado[i][k]['C.I'],
					'Telefono': listado[i][k]['N° DE TELEFONO'],
					'ReciboObservaciones': listado[i][k]['N° RECIBO/ OBSERVACIONES'] 
				});
				
			query += " select '" + ((typeof listado[i][k]['CONTRATO'] == 'undefined') ? '' : listado[i][k]['CONTRATO']) 
						+ "' , '" + ((typeof listado[i][k]['CUOTA'] == 'undefined') ? '' : listado[i][k]['CUOTA']) 
						+ "' , '" + ((typeof listado[i][k]['QUIEN RETIRA'] == 'undefined') ? '' : listado[i][k]['QUIEN RETIRA'])
						+ "' , '" + ((typeof listado[i][k]['C.I'] == 'undefined') ? '' : listado[i][k]['C.I']) 
						+ "' , '" + ((typeof listado[i][k]['N° DE TELEFONO'] == 'undefined') ? '' : listado[i][k]['N° DE TELEFONO']) 
						+ "' , '" + ((typeof listado[i][k]['N° RECIBO/ OBSERVACIONES'] == 'undefined') ? '' : listado[i][k]['N° RECIBO/ OBSERVACIONES']) 
						+ "' union all " 
                        + String.fromCharCode(13)
			}

		}	
	}	
    */
/*
    res.status(200).json({
            cab : cabecera, 
            rows : listado 
        });
*/
        /*
    fs.writeFile('query/resumen.txt', query  , function (err) {
        if (err) return console.log(err);
        console.log('inserto los datos de taller-fca ');
    });	*/

})  

app.get( '/naty',(req, res, next)=>{
    var result = excelToJson({
        source: fs.readFileSync('./uploads/resumen2.xlsx' ), // fs.readFileSync return a Buffer
        //header:{ rows: 2 }, 
        columnToKey: {
            A: 'CONTRATO',
            B: 'CUOTA',
            C: 'QUIEN RETIRA',
            D: 'C.I',
            E: 'N° DE TELEFONO',
            F: 'N° RECIBO/ OBSERVACIONES'
        }        
        //columnToKey: { '*': '{{columnHeader}}' }

    });
	
	var listado = Object.values(result);
	var listado2 = [];
	var sapo = "" , sapo2 = [];
	//console.log(result);
	var query="" ;
	var i;
	for (i = 0; i < listado.length; i++) {
		if (listado[i].length){
		//console.log( ' filas ', listado[i].length);
			
			var k, fecha = "", aux = "";
			for (k = 2; k < listado[i].length; k++) {
                //fecha = ((typeof listado[i][0][0] == 'undefined') ? listado[i][0][1] : listado[i][0][0]);
                sapo2 = Object.values(listado[i][0]);
                sapo += JSON.stringify(sapo2[0]) + String.fromCharCode(13);
                fecha = sapo2[0];
                if (moment(fecha).isValid()){
                    fecha = moment(fecha).format("DD.MM.YYYY");
                }
				listado2.push({
                    'Fecha': fecha,
					'Contrato': listado[i][k]['CONTRATO'],
					'cuota': listado[i][k]['CUOTA'], 
					'QuienRetira': listado[i][k]['QUIEN RETIRA'],
					'Cedula': listado[i][k]['C.I'],
					'Telefono': listado[i][k]['N° DE TELEFONO'],
					'ReciboObservaciones': listado[i][k]['N° RECIBO/ OBSERVACIONES'] 
				});
				
			query += " select '" + ((typeof listado[i][k]['CONTRATO'] == 'undefined') ? '' : listado[i][k]['CONTRATO']) 
                        + "' , '" + ((typeof listado[i][k]['CUOTA'] == 'undefined') ? '' : listado[i][k]['CUOTA']) 
                        + "' , '" + fecha
                        + "' , '" + ((typeof listado[i][k]['QUIEN RETIRA'] == 'undefined') ? '' : listado[i][k]['QUIEN RETIRA'])
						+ "' , '" + ((typeof listado[i][k]['C.I'] == 'undefined') ? '' : listado[i][k]['C.I']) 
						+ "' , '" + ((typeof listado[i][k]['N° DE TELEFONO'] == 'undefined') ? '' : listado[i][k]['N° DE TELEFONO']) 
						+ "' , '" + ((typeof listado[i][k]['N° RECIBO/ OBSERVACIONES'] == 'undefined') ? '' : listado[i][k]['N° RECIBO/ OBSERVACIONES']) 
						+ "' union all " 
                        + String.fromCharCode(13)
				
			}
		}	
	}	

    res.status(200).json({
            listado2  
        });

    
    fs.writeFile('query/resumen.txt', query  , function (err) {
        if (err) return console.log(err);
        console.log('inserto los datos de Naty ');
    });		
    
    

})  
  

app.get( '/derlis',(req, res, next)=>{
    var result = excelToJson({
        source: fs.readFileSync('./uploads/resumen3.xlsx' ), // fs.readFileSync return a Buffer
        header:{ rows: 1 }, 
        /*
        columnToKey: {
            A: 'CONTRATO',
            B: 'CUOTA',
            C: 'QUIEN RETIRA',
            D: 'C.I',
            E: 'N° DE TELEFONO',
            F: 'N° RECIBO/ OBSERVACIONES'
        } */
        columnToKey: { '*': '{{columnHeader}}' }

    });
	
	var listado = Object.values(result);
	var listado2 = [];
    console.log('cantidad de registros por la consulta... ', listado.length);
    console.log(listado[0]);
	var query="";
	var i, cantidad = [];
	for (i = 0; i < listado.length; i++) {
		if (listado[i].length){
		    console.log( ' filas ', listado[i].length);
			
			var k,query;
			for (k = 0; k < listado[i].length; k++) {
                var lista = Object.values(listado[i][k]);

                if (cantidad.indexOf(lista.length) < 0 ){
                    cantidad.push(lista.length);
                }

                if(lista.length == 4 ) query += " select ";
                for(j=0; j < lista.length; j++){
                    //console.log(lista[j]);
                    if(lista.length == 4) query += " '" + ((typeof lista[j] == 'undefined') ? '' : lista[j]) + "' campo"+ j +" , ";
                }
                if(lista.length == 4 ) query += " union all " + String.fromCharCode(13);

                /*
				listado2.push({
					'Contrato': listado[i][k]['CONTRATO'],
					'cuota': listado[i][k]['CUOTA'], 
					'QuienRetira': listado[i][k]['QUIEN RETIRA'],
					'Cedula': listado[i][k]['C.I'],
					'Telefono': listado[i][k]['N° DE TELEFONO'],
					'ReciboObservaciones': listado[i][k]['N° RECIBO/ OBSERVACIONES'] 
				});
				
			query += " select '" + ((typeof listado[i][k]['CONTRATO'] == 'undefined') ? '' : listado[i][k]['CONTRATO']) 
						+ "' , '" + ((typeof listado[i][k]['CUOTA'] == 'undefined') ? '' : listado[i][k]['CUOTA']) 
						+ "' , '" + ((typeof listado[i][k]['QUIEN RETIRA'] == 'undefined') ? '' : listado[i][k]['QUIEN RETIRA'])
						+ "' , '" + ((typeof listado[i][k]['C.I'] == 'undefined') ? '' : listado[i][k]['C.I']) 
						+ "' , '" + ((typeof listado[i][k]['N° DE TELEFONO'] == 'undefined') ? '' : listado[i][k]['N° DE TELEFONO']) 
						+ "' , '" + ((typeof listado[i][k]['N° RECIBO/ OBSERVACIONES'] == 'undefined') ? '' : listado[i][k]['N° RECIBO/ OBSERVACIONES']) 
						+ "' union all " 
                        + String.fromCharCode(13)
             */           
				
			}
		}	
	}	
    console.log(cantidad);
    fs.writeFile('query/garantia.txt', query  , function (err) {
        if (err) return console.log(err);
        console.log('inserto los datos de derlis ');
    });		

    res.status(200).json({
            listado
        });
    
})  


app.get('/excel/:sucursal',(req, res, next)=>{
    var sucursal = req.params.sucursal;
    var archivo = sucursal + '.xlsx';
    //obtener la cabecera .. 
    var result = excelToJson({
        source: fs.readFileSync('./uploads/'+ archivo ), // fs.readFileSync return a Buffer
        header:{ rows: 1 }, 
        sheets: ['Resumen'], 
        columnToKey: {
            A: 'Campaña',
            B: 'Nombre', 
            C: 'Modelos',
            D: 'Tipo',
            E: 'Desde',
            F: 'Hasta'
        } 
    });

    //obtener los items de la campañas... 
    var items = result["Resumen"].map(val =>{ return val["Campaña"].toString()});
    //console.log(items);
    var result2 = excelToJson({
        source: fs.readFileSync('./uploads/'+ archivo ), // fs.readFileSync return a Buffer
        header:{ rows: 1 }, 
        sheets: items, 
        columnToKey: {
            A: 'Vin',
            D: 'Fecha_inicio', 
            E: 'Fecha_fin',
            F: 'Estado',
        } 
    });

    let detalle = [];
    let cab_insert = ""; //" insert into desp_camp ( cod_camp , desc_camp, modelo_camp , tipo , fecha_inicio, fecha_fin ) ";
    let det_insert = ""; //"  insert into campaña ( cod_camp, vin , open_date , close_date , status  ) ";
    let c = 0, d = 0;
    let cab = result["Resumen"].map(val =>{ 
                    c++;        
                    result2[val['Campaña'].toString()].map(del => {
                        d++;
                        detalle.push(
                            {
                                campaña: val['Campaña'].toString(),
                                descripcion:  val['Nombre'], 
                                vin: del['Vin'],
                                modelo : val['Modelos'],
                                "Fecha Inicio": del['Fecha_inicio'],
                                "Fecha Fin": del['Fecha_fin'],
                                "Estado": del['Estado'], 
                                sucursal : sucursal
                            }
                        );

                        if (d == result2[val['Campaña'].toString()].length && c == result["Resumen"].length){
                            det_insert +=  " select '"+ val['Campaña'] + "', '" + del['Vin'] + "', '" + del['Fecha_inicio'] + "', '" + del['Fecha_fin'] + "', '" + del['Estado'] + "', '" + sucursal + "' ";
                        }else{
                            det_insert +=  " select '"+ val['Campaña'] + "', '" + del['Vin'] + "', '" + moment( val['Fecha_inicio']).format('DD-MM-YYYY') + "', '" + moment( val['Fecha_fin']).format('DD-MM-YYYY') + "', '" + del['Estado'] + "', '" + sucursal + "' union ";
                        }
                    })
                    d = 0;
                    if (c == result["Resumen"].length){
                        cab_insert +=  "select '" + val['Campaña'].toString() + "', '" + val['Nombre']+ "', '" + val['Modelos']+ "', '"+ val['Tipo'] +"', '" + moment( val['Desde']).format('DD-MM-YYYY') + "', '" + moment(val['Hasta']).format('DD-MM-YYYY') + "', '" + sucursal + "' " ;
                    }else{
                        cab_insert +=  "select '" + val['Campaña'].toString() + "', '" + val['Nombre']+ "', '" + val['Modelos']+ "', '"+ val['Tipo'] +"', '" + moment( val['Desde']).format('DD-MM-YYYY') + "', '" + moment(val['Hasta']).format('DD-MM-YYYY')+ "', '" + sucursal + "' union all " ;
                    }
                  
                    return {
                        Campaña: val['Campaña'].toString(),
                        Nombre: val['Nombre'], 
                        Modelos: val['Modelos'],
                        Tipo: val['Tipo'],
                        Desde: moment( val['Desde']).format("MM-DD-YYYY"),
                        Hasta: moment( val['Hasta']).format("MM-DD-YYYY"), 
                        sucursal: sucursal 
                        }
                });

    fs.writeFile('query/sql-'+ sucursal +'-cab.txt', cab_insert , function (err) {
        if (err) return console.log(err);
        console.log('inserto el query cab ');
    });

    fs.writeFile('query/sql-'+ sucursal +'-det.txt', det_insert , function (err) {
        if (err) return console.log(err);
        console.log('inserto el query det ');
    }); 

    try {
        fs.unlinkSync("./uploads/"+ archivo, (err)=> {
            if (err) throw err;
            console.log('se elimino el archivo ' +  archivo);
        })
        //file removed
      } catch(err) {
        console.error(err)
      }    

    res.status(200).json({ 
       cabecera: cab, 
       detalle: detalle 
    })   

});




app.get('/test-camp-ins',(req, res, next)=>{
    var sucursal = req.query.sucursal;
    var datos = req.query.dato;
    if (datos == 'cab'){
        consulta = fs.readFileSync('query/sql-'+ sucursal +'-cab.txt','utf8');
    }else{
        consulta = fs.readFileSync('query/sql-'+ sucursal +'-det.txt','utf8');
    }
    sql.query(connectionString, consulta, (err, rows) => {
        if(err){
            console.log('test del insert ... ');
            console.log(err);
        }
        res.status(200).json({
            rows
        });
    });
});

app.get('/camp-ins', async (req, res, next)=>{
    // proceso paso a paso 
    var sucursal = req.query.sucursal;
    var consulta = "";
    var p1 = await
    new Promise ((resolve , reject ) => {
        // consulta para recuperar y ver los resultados en la base datos.. 
        // insertamos cabecera auxiliar 
        consulta = " truncate table control.dbo.des_camp_aux ";
        sql.query(connectionString, consulta, (err, rows) => {
            if(err){
                console.log('insertar en la cabecera ... ');
                console.log(err);
                //reject(err);
                reject('error 1');
            }
            resolve('ok1');
        });
    });
    var p11 = await
    new Promise ((resolve , reject ) => {
        // consulta para recuperar y ver los resultados en la base datos.. 
        // insertamos cabecera auxiliar 
        consulta += " insert into control.dbo.des_camp_aux ( cod_camp , desc_camp, modelo_camp , tipo , fecha_inicio, fecha_fin, marca )";
        consulta +=  fs.readFileSync('query/sql-'+ sucursal +'-cab.txt','utf8');

        sql.query(connectionString, consulta, (err, rows) => {
            if(err){
                console.log('insertar en la cabecera ... ');
                console.log(err);
                //reject(err);
                reject('error 11');
            }
            resolve('ok11');
        });
    });
    var p2 = await
    new Promise ((resolve , reject) =>{
        // insertamos el detalle auxiliar 
        consulta = "";
        consulta = " truncate table control.dbo.campanha_aux ";
        sql.query(connectionString, consulta, (err, rows) => {
            if(err){
                console.log(err);
                //reject(err);
                reject('error 2 cab');
            }
            resolve('ok2');
        });        
    });
    var p22 = await
    new Promise ((resolve , reject) =>{
        // insertamos el detalle auxiliar 
        consulta = "";
        consulta = "  insert into control.dbo.campanha_aux ( cod_camp, vin , open_date , close_date , status ,  marca  ) ";
        consulta +=   fs.readFileSync('query/sql-'+ sucursal +'-det.txt','utf8'); 
        sql.query(connectionString, consulta, (err, rows) => {
            if(err){
                console.log(err);
                reject(err);
                reject('error 22 ');
            }
            resolve('ok22');
        });        
    });
    var p3 = await
    new Promise ((resolve , reject) =>{
        // insertamos de las tablas auxiliares a la tabla produccion.. 
        consulta = "";
        consulta = " INSERT INTO control.dbo.Des_Camp SELECT * FROM control.dbo.des_camp_aux WHERE Cod_Camp NOT IN ( SELECT cod_camp FROM control.dbo.Des_Camp ) " ;
        sql.query(connectionString, consulta, (err, rows) => {
            if(err){
                console.log(err);
                reject('error 3 ');
            }
            resolve('ok3');
        });
    });
    var p33 = await
    new Promise ((resolve , reject) =>{
        // insertamos de las tablas auxiliares a la tabla produccion.. 
        consulta = "";
        //consulta = " select COUNT(*) cantidad from control.dbo.campanha_aux "; 
        consulta = " INSERT INTO control.dbo.Campanha select Cod_Camp , vin , Open_date , Close_date , status , ot, marca from ( SELECT ROW_NUMBER() over(partition by cod_camp , vin order by cod_camp , vin )fila , *  FROM control.dbo.Campanha_aux t1 WHERE not EXISTS ( SELECT 1 FROM control.dbo.Campanha t2 WHERE t2.cod_camp = t1.cod_camp AND t2.vin = t1.vin ) ) t1 where t1.fila = 1 "; 
        sql.query(connectionString, consulta, (err, rows) => {
            if(err){
                console.log(err);
                reject('error 33');
            }
            resolve(rows);
        });
    });
    var p4 = await
    new Promise ((resolve , reject) =>{
        consulta = "";
        consulta =  " SELECT t1.Cod_Camp campaña, t1.Desc_camp descripcion, t1.Modelo_camp modelo , "; 
        consulta += "	   t1.tipo tipo , t1.fecha_inicio fecha_inicio, t1.fecha_fin fecha_fin,         "; 
        consulta += " 	   t1.marca , t2.vin , t2.Close_date fecha_cierre , t2.Status "; 
        consulta += " FROM control.dbo.Des_Camp t1 INNER JOIN control.dbo.Campanha t2 ON t1.Cod_Camp = t2.Cod_Camp and t2.marca = '" + sucursal + "' " ; 
        sql.query(connectionString, consulta, (err, rows) => {
            if(err){
                console.log(err);
                reject('error 4');
            }
            resolve(rows);
        });
    });

    Promise.all([p1, p11, p2, p22, p3, p33, p4]).then(values =>{
		fs.writeFile('query/resultado.txt', JSON.stringify( values ) , function (err) {
			if (err) return console.log(err);
			console.log('inserto el resultado ');
		});	
		console.log(values);
        var resultado = values[6].map(val => {
            return {
                campaña: val['campaña'].toString(),
                descripcion: val['descripcion'],
                modelo: val['modelo'],
                tipo: val['tipo'],
                fecha_inicio:  moment( val['fecha_inicio']).format("MM-DD-YYYY"),
                fecha_fin: moment( val['fecha_fin']).format("MM-DD-YYYY"),
                marca: val['marca'],
                vin: val['vin'],
                fecha_cierre: moment( val['fecha_cierre']).format("MM-DD-YYYY"),
                estado: val['Status']
            }
        })
        res.status(200).json({
            resultado 
        });
    })
    .catch( err => {
        console.log(err);
        res.status(404).json({
            err
        });
    });
});

app.get('/camp-info',(req, res, next)=>{
    var sucursal = req.query.sucursal;
    var consulta = "";

    if (sucursal == 'nissan'){ // caso especial para nissan por que agrupa todos los modelos por campaña... 
        consulta =  " SELECT distinct t1.Cod_Camp campaña, t1.Desc_camp descripcion, "; 
        consulta += "	   t1.tipo tipo , t1.fecha_inicio fecha_inicio, t1.fecha_fin fecha_fin, "; 
        consulta += " 	   t1.marca , t2.vin , t2.Close_date fecha_cierre , t2.Status , t2.ot , case when t2.ot is null then 'NO' else 'SI' end ORDEN "; 
        consulta += " FROM control.dbo.Des_Camp t1 INNER JOIN control.dbo.Campanha t2 ON t1.Cod_Camp = t2.Cod_Camp and t2.marca = '" + sucursal + "' " ; 
     
    }else{ // las demas marcas no tienen ese problema 
        consulta =  " SELECT t1.Cod_Camp campaña, t1.Desc_camp descripcion, t1.Modelo_camp modelo, "; 
        consulta += "	   t1.tipo tipo , t1.fecha_inicio fecha_inicio, t1.fecha_fin fecha_fin, "; 
        consulta += " 	   t1.marca , t2.vin , t2.Close_date fecha_cierre , t2.Status , t2.ot , case when t2.ot is null then 'NO' else 'SI' end ORDEN"; 
        consulta += " FROM control.dbo.Des_Camp t1 INNER JOIN control.dbo.Campanha t2 ON t1.Cod_Camp = t2.Cod_Camp and t2.marca = '" + sucursal + "' " ; 
    
    }


    sql.query(connectionString, consulta, (err, rows) => {
        if(err){
            console.log(err);
            console.log('error informe');
        }
        res.status(200).json({
            rows 
        });
    });
})

app.get('/serhorafac',(req, res, next)=>{
	//para recibir parametros tipo array.. o listado
	const fecha_ini = req.query.fechaini;
	const fecha_fin = req.query.fechafin;

	//para obtener parametros especificos.... 
	//const fecha_ini = req.params.fechaini;
	//const fecha_fin = req.params.fechafin;
	
    const query = "select * from control.dbo.vhorasFacturadastaller where fecha_fac between '"+ fecha_ini +"' and '"+ fecha_fin +"' ";
    sql.query(connectionString, query, (err, rows) => {
        if(err){
            console.log(err);
        }
        //console.log(rows);
        res.status(200).json({
            rows
        });
    });
});


app.get('/info-inventario',(req, res, next)=>{ 
	//para recibir parametros tipo array.. o listado 
	const periodo = req.query.periodo; 
    const query = "select * from control_ch.dbo.v_infoNissan_inventario where inventorydate = '"+ periodo  +"' "; 
    sql.query(connectionString2, query, (err, rows) => { 
        if(err){ 
            console.log(err); 
        } 
        //console.log(rows); 
        res.status(200).json({ 
            rows 
        }); 
    });
});

app.get('/info-servicio',(req, res, next)=>{
	//para recibir parametros tipo array.. o listado
	const periodo = req.query.periodo;
    const query = "select * from control_ch.dbo.v_infoNissan_servicio where left( fechafactura,7) = '"+ periodo +"' ";
    sql.query(connectionString2, query, (err, rows) => {
        if(err){
            console.log(err);
        }
        //console.log(rows);
        res.status(200).json({
            rows
        });
    });
});

app.get('/info-venta',(req, res, next)=>{
	//para recibir parametros tipo array.. o listado
	const periodo = req.query.periodo;
    const query = "select * from control_ch.dbo.v_infoNissan_servicio  ";
    sql.query(connectionString2, query, (err, rows) => {
        if(err){
            console.log(err);
        }
        //console.log(rows);
        res.status(200).json({
            rows
        });
    });
});

app.get('/sistema',(req, res, next)=>{
	//para recibir parametros tipo array.. o listado
	const periodo = req.query.periodo;

    var query = " select 'kill' a, t2.spid bloqueador_id, t2.hostname bloqueador_pc, t4.client_net_address bloqueador_ip, t2.waittime bloqueador_wait , t2.program_name programa2, t2.cmd , t2.status , convert( varchar(20), t2.last_batch,108)hora2 , t2.cpu cpu2, t6.text query2 , t2.stmt_start ";
        query += " , t1.spid victima_id , t1.hostname victima_pc , t3.client_net_address victima_ip, t1.waittime victima_wait , t1.program_name programa1, t1.cmd , t1.status , convert( varchar(20), t1.last_batch,108)hora1 , t1.cpu cpu1,t5.text query1 , t1.stmt_start ";
        query += " from sys.sysprocesses t1 left outer join sys.sysprocesses t2 on t1.blocked = t2.spid  ";
        query += "       inner join sys.dm_exec_connections  t3 on t1.spid = t3.session_id  ";
        query += "        inner join sys.dm_exec_connections  t4 on t2.spid = t4.session_id ";
        query += "        CROSS APPLY sys.dm_exec_sql_text(t1.sql_handle) t5 ";
        query += "        CROSS APPLY sys.dm_exec_sql_text(t2.sql_handle) t6 ";
        query += " where t1.hostname <> '' and t2.hostname <> '' ";
        query += " and t1.spid <> t1.blocked ";
        query += " order by t2.waittime  ";

    sql.query(connectionString, query, (err, rows) => {
        if(err){
            console.log(err);
        }
        //console.log(rows);
        res.status(200).json({
            rows
        });
    });
});

app.get('/presupuesto/:callid',(req, res, next)=>{
	//para recibir parametros tipo array.. o listado
    //const callid = req.query.callid;
    const callid = req.params.callid;

    var query = " SELECT t3.callid ot, t1.u_sucursal , t1.doccur,  t1.DocNum presupuesto, t2.ItemCode codigo, t2.Dscription articulo, t2.Quantity cantidad, t2.LineTotal total ";
    query += " FROM OQUT t1 with(nolock)";
    query += " INNER JOIN QUT1 t2 ON t1.DocEntry = t2.DocEntry ";
    query += " INNER JOIN oscl t3 ON t1.U_NroInterno = t3.DocNum ";
    query += " WHERE t3.callid = "+ callid ;
    query += " ORDER BY 1 ";
    
    sql.query(connectionString, query, (err, rows) => {
        if(err){
            console.log(err);
        }

        var resultado = rows.map(val=>{
            return {
                        orderId: val['ot'].toString(),
                        inspectionPoint: val['articulo'],
                        partId: val['codigo'],
                        priority: "amarillo",
                        quantity: val['cantidad'],
                        unitCost: val['total'],
                        moneda: val['doccur'],
                        sucursal: val['u_sucursal'],
                        labor: "",
                        laborCost: "", 
                        subPoints: {
                                        name:  "",
                                        partId: "",
                                        quantity: "",
                                        unitCost: "",
                                        labor: "",
                                        laborCost: ""
                                    }
                        
                    }
        });
        //console.log(rows);
        res.status(200).json({
            resultado
        });
    });
});


app.get('/seguimiento',(req, res, next)=>{
	//para recibir parametros tipo array.. o listado
	const periodo = req.query.periodo;

    var query = " SELECT * FROM control.dbo.v_seguimientoPresupuestoSeguro WHERE fecha_presupuesto BETWEEN '20201001' AND '20201015' ";

    sql.query(connectionString, query, (err, rows) => {
        if(err){
            console.log(err);
        }
        //console.log(rows);
        res.status(200).json({
            rows
        });
    });
});


app.get('/garantia-tablero',(req, res, next)=>{
	//para recibir parametros tipo array.. o listado
	const fechai = req.query.fechai;
	const fechaf = req.query.fechaf;
	console.log(req.query);
	//const fechai = '2020-12-01';
	//const fechaf = '2020-12-13';

    var query = 
    " select "+ 
    " callID OT "+ 
    " ,CAST( CAST(T1.createDate AS date) AS VARCHAR(100)) FECHA  "+ 
	", (select top 1 CAST( CAST(v.DocDate AS date) AS VARCHAR(100)) "+
	"	from  OINV v with(nolock), INV1 d "+
	"	where v.DocEntry = d.DocEntry "+
	"	and v.cardname not like '%garden%' "+
	"	and v.u_liiv = 1 "+
	"	and d.ItemCode = T1.itemCode ORDER BY V.DOCDATE ASC ) FVENTA "+
    " ,customer CODIGO "+ 
    " ,custmrName CLIENTE "+ 
    " ,substring( itemCode , 4 , 50 ) VIN "+ 
    " ,itemName VEHICULO  "+ 
    " ,replace( subject , 'Ã±', 'Ñ') PEDIDO "+  
    " ,UPPER( T2.U_NAME ) ASESOR  "+ 
	" ,isnull( (select count(*) from control.dbo.solicitudGar where ot = t1.callid ),0 ) solicitud "+
    " from oscl T1 INNER JOIN OUSR T2 ON t1.assignee = t2.userid  "+ 
    " where u_tipo in( 3 , 6 )  "; //tipo 3 es garantia  // se le agrego uso taller garden para reparaciones de vehiculos economicos 
	if ( req.query.ot !== '0' ) {
		query += " and t1.callid = " + req.query.ot ;
	}else{
		query += "and T1.createdate between '"+ fechai +"' and '"+ fechaf +"' ";
	}
    query += " AND U_Sucursal = 'VICTORIA' ";
    try {
        sql.query(connectionString, query, (err, rows) => {
            if(err){
                console.log(err);
            }
            //console.log(rows);
            res.status(200).json({
                rows
            });
        });
    } catch (error) {
        console.log(error);
        res.status(404).json({
            error
        });        
    }
});

app.get('/garantia-existeSol',(req, res, next)=>{
	const ot  = req.query.ot;
    var query = " select usuarioSol_id as usuario from control.dbo.solicitudgar where ot = " + ot;
    try {
        sql.query(connectionString, query, (err, rows) => {
            if(err){
                console.log(err);
                res.status(404).send(err);
            }
            //console.log(rows);
            res.status(200).json({
                rows
            });
        });
    } catch (error) {
        console.log(error);
        res.status(404).json({
            error
        });        
    }
})

app.get('/garantia-repuesto/:ot', async(req, res)=>{

    //https://github.com/yagop/node-telegram-bot-api/issues/472

    try {
        let ot = req.params.ot 

            const remision= await knex
             .select()
             .fromRaw(`
                     (select top 500 
                     b.ItemCode as CODIGO
                     , art.ItemName as ARTICULO
                     , cast( SUM( CASE WHEN WhsCode LIKE '%VIR%' THEN 1 ELSE -1 END * Quantity ) as numeric(18,2)) as CANTIDAD
                     , ot.CallID
                     , left(convert(varchar(100),a.CreateDate,120),10) fecha 
                     , a.DocNum REMISION
                     , stuff(right('0' + cast( a.DocTime as varchar(10)), 4),3,0,':') hora 
                     , (select upper(u_name) from gardenkia.dbo.OUSR with(nolock) where USERID = a.usersign ) userCreate                     
                 from gardenkia.dbo.OWTR a with(nolock) 
                     inner join  gardenkia.dbo.WTR1 b on a.DocEntry = b.DocEntry
                     inner JOIN gardenkia.dbo.OSCL ot with(nolock) ON a.U_NroInterno = ot.DocNum
                     inner join gardenkia.dbo.OCRD cli with(nolock) on ot.customer = cli.CardCode
                     inner join gardenkia.dbo.OITM art with(nolock) on b.itemcode = art.itemcode
                 where  art.ItmsGrpCod in ( select ItmsGrpCod From gardenkia.dbo.oitb with(nolock) where ItmsGrpNam like '%repuesto%' ) 
                 and ot.callID = ?
                 GROUP BY b.ItemCode , art.ItemName , ot.CallID, a.CreateDate,a.DocNum  , a.DocTime , a.usersign
                 HAVING SUM( CASE WHEN WhsCode LIKE '%VIR%' THEN 1 ELSE -1 END * Quantity ) > 0.00 
                 ORDER BY a.docnum
                 ) t1
                  
             `, ot )
     
             const detalle=  await knex
             .select()
             .fromRaw(` (select t1.id , t1.incidente , t1.repuesto from control.dbo.solicitudGarDet t1 inner join control.dbo.solicitudGar t2 on t1.parent = t2.id where t2.ot = ?)t1 `, ot )

        // .then( async(rows)=>{
        //     console.log('lista de repuestos garantia ', rows)
        //     res.status(200).send(rows)
        // })


        console.log('detalle repuesto ', detalle)
        res.status(200).json({remision: remision , detalle: detalle })

    } catch (error) {
        console.log(error);
        res.status(404).send(error);
    }
})


app.get('/garantia-login',(req, res, next)=>{
	//para recibir parametros tipo array.. o listado
	const usu  = req.query.usuario;
	const pass = req.query.pass;
	
    var query = " select usuario , nombre , perfil , estado , isnull( chat_id , 0 ) chat_id from control.dbo.solicitudAcceso  where usuario = '"+ usu +"' and pass = '"+ pass +"'";
    //var query = " select count(*) from solicitudAcceso where usuario = '"+ usu +"' and pass = '"+ pass +"' " ;
    try {
        sql.query(connectionString, query, (err, rows) => {
            if(err){
                console.log(err);
                res.status(404).send(err);
            }
            //console.log(rows);
            res.status(200).json({
                rows
            });
        });
    } catch (error) {
        console.log(error);
        res.status(404).json({
            error
        });        
    }
});


app.get('/garantia-solicitud',(req, res, next)=>{
	//para recibir parametros tipo array.. o listado
	const ot = req.query.ot;
	
    var query = " select callid ot, t1.custmrName cliente, right( t1.itemcode,17) vin, t1.itemName modelo , t2.U_Anho anho, (select convert(varchar(100), min( t11.docdate),105  ) from OINV t11 with(nolock) inner join inv1 t22 with(nolock) on t11.docentry = t22.docentry where t22.itemcode = t1.itemcode ) fechaVenta , convert(varchar(100), GETDATE(),105 ) fecha , replace( t1.subject , 'Ã±', 'Ñ') pedido , t1.U_KmEntrada km "+
				" from gardenkia.dbo.oscl t1 inner join gardenkia.dbo.oitm t2 on t1.itemCode = t2.ItemCode "+
				" where t1.callid = " + ot +" ";
	
	try {
        sql.query(connectionString, query, (err, rows) => {
            if(err){
                console.log(err);
                res.status(404).send(err);			
            }
            //console.log(rows);
            res.status(200).json({
                rows
            });
        });
    } catch (error) {
        console.log(error);
        res.status(404).json({
            error
        });        
    }
});

app.get('/garantia-servicios',(req, res, next)=>{
	//para recibir parametros tipo array.. o listado
	const vin = req.query.vin;
	/*
    var query = " select top 4 row_number() over(order by t1.DocDate desc ) fila, convert(varchar(100), t1.DocDate , 105 ) fecha , t2.ItemCode servicio , t3.U_KmEntrada km "+
				" from OINV t1 with(nolock) inner join INV1 t2 with(nolock) on t1.DocEntry = t2.DocEntry "+
				" inner join OSCL t3 with(nolock) on t1.U_NroInterno = t3.DocNum "+
				" where right( t3.itemcode, 17) = '" + vin + "' "+
				" and t2.ItemCode like 'sc.%' "+
				" order by t1.DocDate desc ";
*/
    var query = `
                    SELECT top 4
                    row_number() over(order by t1.DocDate desc ) fila, 
                    convert(varchar(100), t1.DocDate , 105 )fecha, 
                    t2.itemcode servicio, 
                    t3.U_KmEntrada km 
                    from OINV t1 with(nolock) inner join INV1 t2 with(nolock) on t1.DocEntry = t2.DocEntry 
                    inner join OSCL t3 with(nolock) on t1.U_NroInterno = t3.DocNum 
                    where right( t3.itemcode, 17) = '${vin}'
                    and (t2.ItemCode like 'sc.%' 
                        OR t2.itemcode = 'serv' )
                    GROUP BY  t1.DocDate,	t3.U_KmEntrada, t2.itemcode 
                    ORDER BY t1.DocDate DESC     
                `
    try {
        sql.query(connectionString, query, (err, rows) => {
            if(err){
                console.log(err);
                res.status(404).send(err);
            }
            //console.log(rows);
            res.status(200).json({
                rows
            });
        });
    } catch (error) {
        console.log(error);
        res.status(404).json({
            error
        });        
    }

});

app.get('/garantia-solicitudes',(req, res, next)=>{
	
	//para recibir parametros tipo array.. o listado
	const ot = req.query.ot;
	const usuario = req.query.usuario;
	var area = req.query.area;
	console.log(usuario);
	var query = "";
	
	if(area == 'ADMINISTRADOR'){
		query = " select ROW_NUMBER() over(partition by ot order by t2.id )fila, ROW_NUMBER() over(partition by ot order by t2.id desc )fila2, t1.area, t1.estado, t1.id nro, ot, vin, tipoGarantia, cliente, modelo, convert( varchar(100), fechaVenta, 105 ) FVenta, left( convert( varchar(100), createdate , 120), 10) +' '+ STUFF (createTime , 3, 0, ':') FOt, left( CONVERT(varchar(100), t1.fecha_ins , 120),16) FSolicitud, vdn , t2.repuesto, t2.incidente, t2.piezaCausal, t2.codigoRep, t2.nombreRep, t2.codigoRemision, t2.emisor , t2.fecha , t2.motivo, t2.reparacion , t1.id, t2.estado estado2, t2.id idDet, t1.usuarioSol_id usuario, t1.mecanico ,t1.jefeGrupo, (select nombre from control.dbo.solicitudAcceso where usuario =  usuarioSol_id )nombreJefeGrupo , REPLACE(REPLACE(REPLACE(  replace( t3.subject , 'Ã±', 'Ñ')  , CHAR(13),' '), CHAR(10),' '), CHAR(9),' ') pedido "+
				" from control.dbo.solicitudGar t1 inner join control.dbo.solicitudGardet t2 on t1.id = t2.parent inner join gardenkia.dbo.oscl t3 on t1.ot = t3.callid where case when "+ ot +" = 0 then t1.ot else "+ ot +" end = t1.ot order by t1.fecha_upd desc , t2.id ";

	}else if (area == 'JEFE GRUPO'){
		query = " select ROW_NUMBER() over(partition by ot order by t2.id asc)fila, ROW_NUMBER() over(partition by ot order by t2.id desc )fila2, t1.area, t1.estado, t1.id nro, ot, vin,tipoGarantia, cliente, modelo, convert( varchar(100), fechaVenta, 105 ) FVenta, left( convert( varchar(100), createdate , 120), 10) +' '+ STUFF (createTime , 3, 0, ':') FOt, left( CONVERT(varchar(100), t1.fecha_ins , 120),16) FSolicitud, vdn , t2.repuesto, t2.incidente, t2.piezaCausal, t2.codigoRep, t2.nombreRep, t2.codigoRemision, t2.emisor , t2.fecha , t2.motivo, t2.reparacion , t1.id, t2.estado estado2, t2.id idDet, t1.usuarioSol_id usuario, t1.mecanico ,t1.jefeGrupo, (select nombre from control.dbo.solicitudAcceso where usuario =  usuarioSol_id )nombreJefeGrupo , REPLACE(REPLACE(REPLACE(  replace( t3.subject , 'Ã±', 'Ñ')  , CHAR(13),' '), CHAR(10),' '), CHAR(9),' ') pedido "+
				" from control.dbo.solicitudGar t1 inner join control.dbo.solicitudGardet t2 on t1.id = t2.parent inner join gardenkia.dbo.oscl t3 on t1.ot = t3.callid where case when "+ ot +" = 0 then t1.ot else "+ ot +" end = t1.ot and t1.usuarioSol_id = '"+ usuario +"' order by t1.ot, t1.fecha_upd desc, t2.id ";
	
	}else{
		if(area == 'JEFE TALLER'){ 
			area = "'SOLICITUD', 'TALLER'";
			query = " select ROW_NUMBER() over(partition by ot order by t2.id )fila, ROW_NUMBER() over(partition by ot order by t2.id desc )fila2, t1.area, t1.estado, t1.id nro, ot, vin,tipoGarantia, cliente, modelo, convert( varchar(100), fechaVenta, 105 ) FVenta, left( convert( varchar(100), createdate , 120), 10) +' '+ STUFF (createTime , 3, 0, ':') FOt, left( CONVERT(varchar(100), t1.fecha_ins , 120),16) FSolicitud, vdn , t2.repuesto, t2.incidente , t2.piezaCausal, t2.codigoRep, t2.nombreRep, t2.codigoRemision, t2.emisor , t2.fecha , t2.motivo, t2.reparacion , t1.id, t2.estado estado2, t2.id idDet, t1.usuarioSol_id usuario, t1.mecanico ,t1.jefeGrupo, (select nombre from control.dbo.solicitudAcceso where usuario =  usuarioSol_id )nombreJefeGrupo , REPLACE(REPLACE(REPLACE(  replace( t3.subject , 'Ã±', 'Ñ')  , CHAR(13),' '), CHAR(10),' '), CHAR(9),' ') pedido " +
					" from control.dbo.solicitudGar t1 inner join control.dbo.solicitudGardet t2 on t1.id = t2.parent inner join gardenkia.dbo.oscl t3 on t1.ot = t3.callid where case when "+ ot +" = 0 then t1.ot else "+ ot +" end = t1.ot and t1.area in ("+ area +") order by t1.fecha_upd desc , t2.id ";
			
		}else if(area == 'GARANTIA'){
			area = "'TALLER', 'GARANTIA'";
			query = " select ROW_NUMBER() over(partition by ot order by t2.id )fila, ROW_NUMBER() over(partition by ot order by t2.id desc )fila2, t1.area, t1.estado, t1.id nro, ot, vin,tipoGarantia, cliente, modelo, convert( varchar(100), fechaVenta, 105 ) FVenta, left( convert( varchar(100), createdate , 120), 10) +' '+ STUFF (createTime , 3, 0, ':') FOt, left( CONVERT(varchar(100), t1.fecha_ins , 120),16) FSolicitud, vdn , t2.repuesto, t2.incidente , t2.piezaCausal, t2.codigoRep, t2.nombreRep, t2.codigoRemision, t2.emisor , t2.fecha , t2.motivo, t2.reparacion , t1.id, t2.estado estado2, t2.id idDet, t1.usuarioSol_id usuario, t1.mecanico ,t1.jefeGrupo, (select nombre from control.dbo.solicitudAcceso where usuario =  usuarioSol_id )nombreJefeGrupo, t1.fecha_upd , REPLACE(REPLACE(REPLACE(  replace( t3.subject , 'Ã±', 'Ñ')  , CHAR(13),' '), CHAR(10),' '), CHAR(9),' ') pedido  " +
					" from control.dbo.solicitudGar t1 inner join control.dbo.solicitudGardet t2 on t1.id = t2.parent inner join gardenkia.dbo.oscl t3 on t1.ot = t3.callid where case when "+ ot +" = 0 then t1.ot else "+ ot +" end = t1.ot and t1.area = 'TALLER' AND t1.estado = 'APROBADO' "+
					" union all " +
					" select ROW_NUMBER() over(partition by ot order by t2.id )fila, ROW_NUMBER() over(partition by ot order by t2.id desc )fila2, t1.area, t1.estado, t1.id nro, ot, vin,tipoGarantia, cliente, modelo, convert( varchar(100), fechaVenta, 105 ) FVenta, left( convert( varchar(100), createdate , 120), 10) +' '+ STUFF (createTime , 3, 0, ':') FOt, left( CONVERT(varchar(100), t1.fecha_ins , 120),16) FSolicitud, vdn , t2.repuesto, t2.incidente , t2.piezaCausal, t2.codigoRep, t2.nombreRep, t2.codigoRemision, t2.emisor , t2.fecha , t2.motivo, t2.reparacion , t1.id, t2.estado estado2, t2.id idDet, t1.usuarioSol_id usuario, t1.mecanico ,t1.jefeGrupo, (select nombre from control.dbo.solicitudAcceso where usuario =  usuarioSol_id )nombreJefeGrupo, t1.fecha_upd , REPLACE(REPLACE(REPLACE(  replace( t3.subject , 'Ã±', 'Ñ')  , CHAR(13),' '), CHAR(10),' '), CHAR(9),' ') pedido  " +
					" from control.dbo.solicitudGar t1 inner join control.dbo.solicitudGardet t2 on t1.id = t2.parent inner join gardenkia.dbo.oscl t3 on t1.ot = t3.callid where case when "+ ot +" = 0 then t1.ot else "+ ot +" end = t1.ot and t1.area = 'GARANTIA' order by t1.fecha_upd DESC, t2.id ";
					
		}else if (area == 'REPUESTO'){
			area = "'GARANTIA', 'REPUESTO'";
			query = " select ROW_NUMBER() over(partition by ot order by t2.id )fila, ROW_NUMBER() over(partition by ot order by t2.id desc )fila2, t1.area, t1.estado, t1.id nro, ot, vin,tipoGarantia, cliente, modelo, convert( varchar(100), fechaVenta, 105 ) FVenta, left( convert( varchar(100), createdate , 120), 10) +' '+ STUFF (createTime , 3, 0, ':') FOt, left( CONVERT(varchar(100), t1.fecha_ins , 120),16) FSolicitud, vdn , t2.repuesto, t2.incidente , t2.piezaCausal, t2.codigoRep, t2.nombreRep, t2.codigoRemision, t2.emisor , t2.fecha , t2.motivo, t2.reparacion , t1.id, t2.estado estado2, t2.id idDet, t1.usuarioSol_id usuario, t1.mecanico ,t1.jefeGrupo, (select nombre from control.dbo.solicitudAcceso where usuario =  usuarioSol_id )nombreJefeGrupo, t1.fecha_upd , REPLACE(REPLACE(REPLACE(  replace( t3.subject , 'Ã±', 'Ñ')  , CHAR(13),' '), CHAR(10),' '), CHAR(9),' ') pedido  " +
					" from control.dbo.solicitudGar t1 inner join control.dbo.solicitudGardet t2 on t1.id = t2.parent inner join gardenkia.dbo.oscl t3 on t1.ot = t3.callid where case when "+ ot +" = 0 then t1.ot else "+ ot +" end = t1.ot and t1.area = 'GARANTIA' AND t1.estado = 'APROBADO' "+
					" union all "+
					" select ROW_NUMBER() over(partition by ot order by t2.id )fila, ROW_NUMBER() over(partition by ot order by t2.id desc )fila2, t1.area, t1.estado, t1.id nro, ot, vin,tipoGarantia, cliente, modelo, convert( varchar(100), fechaVenta, 105 ) FVenta, left( convert( varchar(100), createdate , 120), 10) +' '+ STUFF (createTime , 3, 0, ':') FOt, left( CONVERT(varchar(100), t1.fecha_ins , 120),16) FSolicitud, vdn , t2.repuesto, t2.incidente , t2.piezaCausal, t2.codigoRep, t2.nombreRep, t2.codigoRemision, t2.emisor , t2.fecha , t2.motivo, t2.reparacion , t1.id, t2.estado estado2, t2.id idDet, t1.usuarioSol_id usuario , t1.mecanico ,t1.jefeGrupo, (select nombre from control.dbo.solicitudAcceso where usuario =  usuarioSol_id )nombreJefeGrupo, t1.fecha_upd  , REPLACE(REPLACE(REPLACE(  replace( t3.subject , 'Ã±', 'Ñ')  , CHAR(13),' '), CHAR(10),' '), CHAR(9),' ') pedido " +
					" from control.dbo.solicitudGar t1 inner join control.dbo.solicitudGardet t2 on t1.id = t2.parent inner join gardenkia.dbo.oscl t3 on t1.ot = t3.callid where case when "+ ot +" = 0 then t1.ot else "+ ot +" end = t1.ot and t1.area = 'REPUESTO' order by t1.fecha_upd DESC, t2.id ";
		}
	 
	}
	
	/*
    fs.writeFile('consulta.txt', JSON.stringify(query ) , function (err) {
        if (err) return console.log(err);
    });
	*/
	//console.log(query);
    try {
        sql.query(connectionString, query, (err, rows) => {
            if(err){
                console.log(err);
                res.status(404).send(err);
            }
            //console.log(rows);
            res.status(200).json({
                rows
            });
        });
    } catch (error) {
        console.log(error);
        res.status(404).json({
            error
        });        
    }
});

app.get('/garantia-log',(req, res, next)=>{
	//para recibir parametros tipo array.. o listado
	const solicitud = req.query.solicitud;
	var query = "";
		query = " SELECT left( convert( varchar(100), fecha_ins ,120 ),16) fecha , area , estado , usuario , motivo , idSolicitud NroSolicitud FROM control.dbo.solicitudAprobacion where idSolicitud =  " + solicitud + " order by fecha_ins ";
    try {
        sql.query(connectionString, query, (err, rows) => {
            if(err){
                console.log(err);
                res.status(404).send(err);
            }
            //console.log(rows);
            res.status(200).json({
                rows
            });
        });
    } catch (error) {
        console.log(error);
        res.status(404).json({
            error
        });        
    }
});


app.get('/garantia-fotos/:ot', async(req, res)=>{
	//para recibir parametros tipo array.. o listado
	//const solicitud = req.query.solicitud;
    try {
        let ot = req.params.ot 
        await knex('solicitudGar_fotos')
        .select()
        .where('caption', ot )
        .then( async(rows)=>{
            console.log('ot ', ot)
            console.log('lista ', rows)
            if(rows.length > 0){
                let link
                const lista = await Promise.all( rows.map(async item =>{
                    try {
                        link = await bot.getFile(item.fotoId)
                        return (  link.fileLink )
                    } catch (error) {
                        //console.log('hubo un error al traer las fotos ', error)                        
                    }
                }))
                .catch( err => {
                    console.log(err);
                    res.status(404).json({
                        err
                    });
                });
        
                console.log('links ', [...new Set(lista)] )
                res.status(200).send([...new Set(lista)])
            }else{
                res.status(200).json({foto: ''});
            }

        })
    } catch (error) {
        console.log(error);
        res.status(404).send(error);
    }

});

app.get('/garantia-descargar-fotos/:ot', async(req, res) => {
    const ot = req.params.ot
    try { 
        var zip = new AdmZip()
        request(`http://192.168.10.54:3010/garantia-fotos/${ot}`,function (error, response, body) {
    
          console.error('error:', error); // Print the error if one occurred
          console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
          console.log('body:', body); // Print the HTML for the Google homepage.
          console.log('type', typeof body); // Print the
          let fotos = JSON.parse(body) 
          console.log(fotos)
          try {
            if(!fs.existsSync(`./${ot}`)) {
              fs.mkdirSync(`${ot}`)
            }
            let count = 0  
            fotos.forEach(async (item,x)=>{
              new Promise(async(resolve,reject) =>{
                await request(item)
                      .pipe(fs.createWriteStream(`${ot}/${ot}_${x}.jpg`))
                      .on('finish', e => resolve(1))
                      .on('error', e => reject(e))
              })
              .then(e=>{
                count++
                if(count === fotos.length ){
                  zip.addLocalFolder(`${ot}`)
                  zip.writeZip(`${ot}.zip`)
                }        
              })
              .then(e=>{
                if(count === fotos.length ){
                  res.download(path.join(__dirname, `${ot}.zip`), (err)=>{
                    fs.unlinkSync(path.join(__dirname, `${ot}.zip`))
                    fs.rmSync(path.join(__dirname, `${ot}`), { recursive: true, force: true })
                  })              
                }        
              })
              .catch(e=>{
                console.log(e)
              })
            })//end fotos 
            
          } catch (error) {
            console.log(error)
          }
        })//end first request 
  
    } catch (error) {
      console.log('ocurrion un error ', error )
      res.end()
    }
  })//end post



app.get('/garantia-lista-usuarios',(req, res, next)=>{
	//para recibir parametros tipo array.. o listado
	//const solicitud = req.query.solicitud;
	var query = " select row_number() over(order by id ) fila , id , usuario , pass , nombre , perfil , estado , left( convert( varchar(100), fecha_ins , 120 ), 16 ) fecha_ins , chat_id from control.dbo.solicitudAcceso ";
    try {
        sql.query(connectionString, query, (err, rows) => {
            if(err){
                console.log(err);
                res.status(404).send(err);
            }
            //console.log(rows);
            res.status(200).json({
                rows
            });
        });        
    } catch (error) {
        console.log(error);
        res.status(404).json({
            error
        });        
    }
});

app.post('/garantia-ins-ser-ter',(req, res)=>{ 
	console.log(req.body); 
	if(!req.body) return res.sendStatus(400);
    try {
        let datos = req.body 
        knex('solicitudServicioTercero')
        .insert(datos)
        .then((e)=>{
            console.log('se insertaron datos para garantia servicios terceros  ',e)
            res.status(200).json({ message: 'ok' });
        })
    } catch (error) {
        console.log(error);
        res.status(404).send(error);
    }

})

app.get('/garantia-ser-ter/:ot',(req, res)=>{ 
	
    const ot = req.params.ot
	if(!req.params.ot) return res.sendStatus(400);
    try {
        knex('solicitudServicioTercero')
        .select()
        .where('ot', ot)
        .then((rows)=>{
            res.status(200).json(rows);
        })
    } catch (error) {
        console.log(error);
        res.status(404).send(error);
    }
})

app.get('/garantia-chatId/:user',(req, res)=>{ 
	
    const user = req.params.user
	if(!req.params.user) return res.sendStatus(400);
    try {
        knex('solicitudAcceso')
        .select('chat_id')
        .where('usuario', user)
        .then((rows)=>{
            res.status(200).json(rows);
        })
    } catch (error) {
        console.log(error);
        res.status(404).send(error);
    }
})

app.post('/garantia-ins-cab',(req, res)=>{ 
	console.log(req.body); 
	if(!req.body) return res.sendStatus(400); 
	var datos = req.body; 
	console.log('cabecera ins ... ', Array.isArray(datos));	
    var p4 = 
    new Promise ((resolve , reject) =>{
        /*
		var query = " insert into control.dbo.solicitudGar ( ot , vin , cliente , modelo , fechaVenta , fechaReclamo , vdn , estado, usuariosol_id , area , tipoGarantia , mecanico , jefeGrupo ) "+
					" select "+ datos.ot +" , '"+ datos.vin +"' , '"+ datos.cliente +"' , '"+ datos.modelo +"' , '"+ datos.fechaVenta +"' , '"+ datos.fecha +"', '"+ datos.vdn +"', 'NUEVO'"+ datos.usuario +"' , '"+ datos.area +"' , '"+ datos.tipoGarantia +"', '"+ datos.mecanico +"','"+ datos.jefeGrupo +"' " ;
*/
        var query = " insert into control.dbo.solicitudGar ( ot , vin , cliente , modelo , fechaVenta , fechaReclamo , vdn , estado, usuariosol_id , area , tipoGarantia , mecanico , jefeGrupo ) "+
        " select "+ datos.ot +" , '"+ datos.vin +"' , '"+ datos.cliente +"' , '"+ datos.modelo +"' , '"+ datos.fechaVenta +"' , '"+ datos.fecha +"', '"+ datos.vdn +"', 'PENDIENTE', '"+ datos.usuario +"', 'GARANTIA', '"+ datos.tipoGarantia +"', '"+ datos.mecanico +"','"+ datos.jefeGrupo +"' " ;

		sql.query(connectionString, query, (err, rows) => {
			if(err){
				console.log(err);
				reject(err)
			}
			resolve(datos.ot);
		});
		
	});
	p4.then(value => {
		console.log('valor devuelto del promise ... ', value);
		query = " select top 1 id from control.dbo.solicitudGar where ot =  " +  value +" order by id desc ";
		sql.query(connectionString, query, (err, rows) => {
			if(err){
				console.log(err);
			}
			//console.log(rows	
			res.status(200).json({
				rows
			});
		});		
		
	})
    .catch( err => {
        console.log(err);
        res.status(404).json({
            err
        });
    });	

});

app.post('/garantia-upd-cab',(req, res)=>{ 
	console.log(req.body); 
	if(!req.body) return res.sendStatus(400); 
	var datos = req.body; 
    try{
        console.log('cabecera upd ... ', Array.isArray(datos));	
        var query = " update control.dbo.solicitudGar set estado = '"+ datos.estado +"' , area = '"+ datos.area +"' where id =  "+ datos.id ;
        sql.query(connectionString, query, (err, rows) => {
            if(err){
                console.log(err);
                res.status(404).send(err);
            }
            res.sendStatus(201).end();
        });
    }catch(err){
        console.log('error actualizar usuario telegram cab ', err)
        res.status(404).json({
            err
        });        
    }

});


app.post('/garantia-upd-det/:idCab/:idDet', async(req, res)=>{ 
	console.log(req.body); 
	if(!req.body) return res.sendStatus(400); 
	var datos = req.body
    var idCab = req.params.idCab
    var idDet = req.params.idDet

	console.log('detalle upd ... ', Array.isArray(datos));	
    try {
        await knex("solicitudGarDet")
        .update(datos)
        .where("id", idDet)
        .then(async(x)=>{

            await knex('solicitudGar')
                .update('estado', 'PENDIENTE')
                .where("id", idCab)
                .then(x=>{
                    res.sendStatus(201).end();
                })

        })        
    } catch (error) {
        console.log('hubo un error al actualziar los datos del detalle', error)
        res.status(404).send(err);
    }
});


app.post('/garantia-upd-det-motivo/:idDet', async(req, res)=>{ 
	console.log(req.body); 
	if(!req.body) return res.sendStatus(400); 
	var datos = req.body
    var idDet = req.params.idDet

	console.log('detalle upd ... ', Array.isArray(datos))
    try {
        await knex("solicitudGarDet")
        .update(datos)
        .where("id", idDet)
        .then((x)=>{
            res.sendStatus(201).end();
        })        
    } catch (error) {
        console.log('hubo un error al actualziar los datos del detalle', error)
        res.status(404).send(err);
    }
});


app.post('/garantia-upd-det-rep', async(req, res)=>{ 
	console.log(req.body); 
	if(!req.body) return res.sendStatus(400); 
	var datos = req.body
    let row 
    try {
        await Promise.all([
            datos.forEach(async(item)=>{
                row = {
                        codigoRep: item.codigo ,
                        nombreRep:item.nombre , 
                        codigoRemision: item.remision , 
                        emisor: item.emisor , 
                        fecha: item.fecha 
                    }
                await knex("solicitudGarDet")
                .update(row)
                .where("id", item.id)
            })
        ]).then(x=>{
            res.sendStatus(201).end();
        })
        .catch( err => {
            console.log(err);
            res.status(404).json({
                err
            });
        });


    } catch (error) {
        console.log('hubo un error al actualziar los datos del detalle', error)
        res.status(404).send(error);
    }
});

app.post('/garantia/ins-ser-tercero', (req , res )=> {
	console.log(req.body); 
	if(!req.body) return res.sendStatus(400); 
	var datos = req.body; 
	console.log('detalle ins servicios terceros ... ', Array.isArray(datos) ); 

})

app.post('/garantia-ins-det',(req, res)=>{ 
	console.log(req.body); 
	if(!req.body) return res.sendStatus(400); 
	var datos = req.body; 
	console.log('detalle ins ... ', Array.isArray(datos.repuesto) ); 
	if( Array.isArray(datos.repuesto) ){ 
		console.log( 'cantidad de filas ' , datos.repuesto.length );
		var query2 = ""; 
		//agrupar las filas para insertar de una vez... es el query2 
		for (var i = 0; i < datos.repuesto.length; i++) {
			if ( i == (datos.repuesto.length - 1) ){
				query2 += " select '"+ datos.repuesto[i] +"' , '"+ datos.motivo[i] +"' , '"+ datos.reparacion[i] +"' , '"+ datos.estado[i] +"' , "+ datos.parent[i] +", '"+ datos.incidente[i] +"', '"+ datos.piezaCausal[i] +"' ";
			}else {
				query2 += " select '"+ datos.repuesto[i] +"' , '"+ datos.motivo[i] +"' , '"+ datos.reparacion[i] +"' , '"+ datos.estado[i] +"' , "+ datos.parent[i]+", '"+ datos.incidente[i] +"','"+ datos.piezaCausal[i] +"' union all " ;
			}
		}
		var	query = " insert into control.dbo.solicitudGardet ( repuesto , motivo, reparacion, estado , parent , incidente , piezaCausal) "+ query2 
		console.log(query); 
        try {
            sql.query(connectionString, query, (err, rows) => {
                if(err){
                    console.log(err);
                    res.status(404).send(err);
                }
                res.sendStatus(201).end();
            });
        } catch (error) {
            console.log(error);
            res.status(404).json({
                error
            });        
        }
            
	}else{
		var query = " insert into control.dbo.solicitudGardet ( repuesto , motivo , reparacion , estado , parent, incidente, piezaCausal ) "+
				" select '"+ datos.repuesto +"' , '"+ datos.motivo +"' , '"+ datos.reparacion +"' , '"+ datos.estado +"' , "+ datos.parent +", '"+datos.incidente+"' " +", '"+datos.piezaCausal+"' " ;
        try {
            sql.query(connectionString, query, (err, rows) => {
                if(err){
                    console.log(err);
                    res.status(404).send(err);
                }
                res.sendStatus(201).end();
            });
        } catch (error) {
            console.log(error);
            res.status(404).json({
                error
            });        
        }
    }
});	


app.post('/garantia-ins-usuario',(req, res)=>{ 
	console.log(req.body); 
	if(!req.body) return res.sendStatus(400); 
	var datos = req.body; 
	console.log('usuario nuevo ... ', Array.isArray(datos));
	var query = " insert into control.dbo.solicitudAcceso (usuario , pass , nombre , perfil , estado , chat_id ) " + 
				" select '"+ datos.usuario +"', '"+ datos.pass +"', '"+ datos.nombre +"', '"+ datos.perfil +"', '"+ datos.estado +"' , "+ datos.chat_id +" ";
	console.log(query);
	sql.query(connectionString, query, (err, rows) => {
		if(err){
			console.log(err);
			res.status(404).send(err);
		}
		res.sendStatus(201).end();
	});

});

app.post('/garantia-upd-usuario',(req, res)=>{ 
	console.log(req.body); 
	if(!req.body) return res.sendStatus(400); 
	var datos = req.body; 
	console.log('actualizar usuarios ... ', Array.isArray(datos));	
	var query = "update control.dbo.solicitudAcceso set estado = '"+ datos.estado +"' ,  pass= '"+ datos.pass +"' , perfil = '"+ datos.perfil +"', chat_id = "+ datos.chat_id +"  where id =  " + datos.id;
    try {
        sql.query(connectionString, query, (err, rows) => {
            if(err){
                console.log(err);
                res.status(404).send(err);
            }
            res.sendStatus(201).end();
        });
    } catch (error) {
        console.log(error);
        res.status(404).json({
            error
        });        
    }
});

app.get('/solicitudCredito/:documento',(req, res)=>{ 

    const documento = req.params.documento || '4277215'

    try {
        var query = `SELECT * FROM control.dbo.solicitudCreditos2 WHERE contactoDocumento = '${documento}' or solicitud like '%${documento}%' `
        sql.query(connectionString, query, (err, rows) => {
            if(err){
                console.log(err);
                res.status(404).send(err);
            }
            res.status(200).json(rows);
        });
        
    } catch (error) {
        console.log('error en la solicitud credito ', error )
        res.status(404).send(error);

    }

});



app.post('/garantia-aprobacion',(req, res)=>{ 

	if(!req.body) return res.sendStatus(400); 
	var datos = req.body; 
	console.log(datos);
	
	/*
	if (typeof datos.idDet == 'undefined') {
	  console.log('no existen datos del detalle.. ');
	}
	console.log(datos); 
	res.sendStatus(201).end();
	return;
	*/
    try {
        var p1 = new Promise ((resolve , reject) =>{
            //primero insertamos en el log de aprobaciones.. luego update de la solicitud y luego el detalle .. 
            var query = " insert into control.dbo.solicitudaprobacion (usuario, estado, idSolicitud, motivo, area) "+
                        " select '"+ datos.usuario +"', '"+ datos.estado +"', "+ datos.id +", '"+ datos.motivo +"', '"+ datos.area +"' ";
    
            sql.query(connectionString, query, (err, rows) => {
                if(err){
                    console.log('error de insercion en aprobacion... ');
                    console.log(err);
                    reject('error al insertar aprobacion');
                    //res.status(404).send(err);
                }
                //res.sendStatus(201).end();
                resolve('1');
                //res.sendStatus(201).end();
            });
            
        })
        
        p1.then(value =>{
            //actualizar la cab.. 
            query = " update control.dbo.solicitudGar set area = '"+ datos.area +"' , estado = '"+ datos.estado +"', fecha_upd = getdate(), user_upd = '"+ datos.usuario +"' "+
                    " where id = " +  datos.id ;
    
            sql.query(connectionString, query, (err, rows) => {
                if(err){
                    console.log('error en update de solicitud');
                    console.log(err);
                    reject('error al grabar cab de solicitud');
                    //res.status(404).send(err);
                }
                resolve('1');
                //res.sendStatus(201).end();
            });
            
        })
        .then(value =>{
            var query2 = "";
            if (typeof datos.idDet == 'undefined') {
              console.log('no existen datos del detalle.. ');
              //resolve(1);
              res.sendStatus(201).end();
              //aqui termina si no tene detalle.. 
              
            }else{
                //si marco varios item del detalle hay que recorrer los datos .. 
                if( Array.isArray(datos.idDet) ){ 
                    for (var i = 0; i < datos.idDet.length; i++) { 
                        if ( i == (datos.idDet.length - 1) ){ 
                            query2 += " select " + datos.idDet[i] + " "; 
                        }else{ 
                            query2 += " select " + datos.idDet[i] + " union all "; 
                        } 
                    } 
                }else{ 
                    query2 = " select " + datos.idDet + " "; 
                } 
                //actualizar la det.. 
                query = " update control.dbo.solicitudGarDet set estado = '"+ datos.estado +"' , fecha_upd = getdate() "+ 
                        " where id in ( " +  query2 + " ) and estado <> 'RECHAZADO'" ; 
                        
                sql.query(connectionString, query, (err, rows) => {
                    if(err){
                        console.log('error update detalle');
                        console.log(err);
                        reject('error al actualizar detalle de solicitud');
                        //res.status(404).send(err);
                    }
                    //resolve(1);
                    res.sendStatus(201).end();
                    //aqui termina la actualizacion... si es que tiene detalle 
                });
                
            }
            
        })
        .catch( err => {
            console.log(err);
            res.status(404).json({
                err
            });
        });
        
    } catch (error) {
        console.log(err);
        res.status(404).json({
            err
        });        
    }
	

	//return ;
	/*
		estados de aprobacion 
		1 nuevo 
		2 taller 
		3 garantia 
		4 repuesto 
		
		estados de rechazos 
		2  r-taller 
		3  r-garantia
		
	*/

});	

module.exports = app;