package com.fluxui.jms;

import org.hornetq.api.core.HornetQException;
import org.hornetq.api.core.TransportConfiguration;
import org.hornetq.api.core.client.*;
import org.hornetq.api.core.management.ManagementHelper;
import org.hornetq.api.jms.HornetQJMSClient;
import org.hornetq.api.jms.JMSFactoryType;
import org.hornetq.core.remoting.impl.netty.NettyConnectorFactory;
import org.hornetq.core.remoting.impl.netty.TransportConstants;
import org.hornetq.jms.client.HornetQConnectionFactory;

import javax.enterprise.context.ApplicationScoped;
import javax.jms.*;
import javax.jms.Session;
import javax.mail.*;
import javax.mail.Message;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeMessage;
import javax.naming.Context;
import javax.naming.InitialContext;
import javax.naming.NamingException;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.*;

/**
 * Created with IntelliJ IDEA.
 * User: wesleyhales
 * Date: 8/11/12
 * Time: 6:29 PM
 * To change this template use File | Settings | File Templates.
 */
@ApplicationScoped
public class PerfQueueManager {

//    todo implement for async code
//    https://community.jboss.org/thread/178079

    private static final String DEFAULT_USERNAME = "quickstartUser";
    private static final String DEFAULT_PASSWORD = "quickstartPassword";
    private static final String INITIAL_CONTEXT_FACTORY = "org.jboss.naming.remote.client.InitialContextFactory";
    private static final String PROVIDER_URL = "remote://localhost:4447";
    private static final String DEFAULT_CONNECTION_FACTORY = "jms/RemoteConnectionFactory";
    Context context;
    HornetQConnectionFactory connectionFactory;
    Destination destination;
    Connection connection;
    Session session;
    MessageProducer messageProducer;
    MessageConsumer consumer;
    boolean done = true;

    private int incomingMsgs = 0;

    private Timer timer = null;

    private void startTimer(){
        if(timer == null){
            timer = new Timer();
            System.out.println("+++timer is null");
            if(incomingMsgs >= 0){
                timer.schedule(new TimerTask() {
                    public void run()  {
                        // do stuff
                        //System.out.println("TimerTask running poll1: " + incomingMsgs);
                        if(incomingMsgs >= 0){
                            //if(done){
                                runTest();
//                                System.out.println("test ran poll2: " + incomingMsgs);
                            //}
                        }

                    }
                }, 10000, 10000);
            }
        }
    }

    private boolean sendMessage(String email, String uuid){
        String host = "smtp.gmail.com";
        final String from = "fluxuimail@gmail.com";
        final String pass = "emailuser";
        Properties props = System.getProperties();
        props.put("mail.smtp.starttls.enable", "true"); // added this line
        props.put("mail.smtp.host", host);
        props.put("mail.smtp.user", from);
        props.put("mail.smtp.password", pass);
        props.put("mail.smtp.port", "587");
        props.put("mail.smtp.auth", "true");

        String[] to = {email}; // added this line
        String bcc = "wesleyhales@gmail.com";
        javax.mail.Authenticator authenticator = new javax.mail.Authenticator()
        {
            protected javax.mail.PasswordAuthentication getPasswordAuthentication()
            {
                return new javax.mail.PasswordAuthentication(from, pass);
            }
        };
        javax.mail.Session session = javax.mail.Session.getInstance(props, authenticator);
        MimeMessage message = new MimeMessage(session);
        try {
            message.setFrom(new InternetAddress("fluxuimail@gmail.com"));

            InternetAddress[] toAddress = new InternetAddress[to.length];

            // To get the array of addresses
            for( int i=0; i < to.length; i++ ) { // changed from a while loop
                toAddress[i] = new InternetAddress(to[i]);
            }
            InternetAddress bccAddress = new InternetAddress(bcc);
            System.out.println("send email to:" + email + " uuid:" + uuid);

            for( int i=0; i < toAddress.length; i++) { // changed from a while loop
                message.addRecipient(javax.mail.Message.RecipientType.TO, toAddress[i]);
                message.addRecipient(Message.RecipientType.BCC, bccAddress);
            }
            message.setSubject("Your loadreport is done!");
            message.setText("Check it out. Here's your report: http://loadreport.wesleyhales.com/rest/performance/speedreport?uuid=" + uuid);
            Transport transport = session.getTransport("smtps");
            transport.connect(host,from,pass);
            System.out.println("-------send mail");
            transport.sendMessage(message, message.getAllRecipients());
            transport.close();
        } catch (MessagingException e) {
            e.printStackTrace();  //To change body of catch statement use File | Settings | File Templates.
        }
        return true;

    }

    private void setupJMS() throws NamingException, JMSException {
        if(context == null){
            final Properties env = new Properties();
            env.put(Context.INITIAL_CONTEXT_FACTORY, INITIAL_CONTEXT_FACTORY);
            env.put(Context.PROVIDER_URL, PROVIDER_URL);
            env.put(Context.SECURITY_PRINCIPAL, DEFAULT_USERNAME);
            env.put(Context.SECURITY_CREDENTIALS, DEFAULT_PASSWORD);
            context = new InitialContext(env);
            //if(connectionFactory == null){
            String connectionFactoryString = System.getProperty("connection.factory", DEFAULT_CONNECTION_FACTORY);
            //connectionFactory = (ConnectionFactory) context.lookup("jms/RemoteConnectionFactory");

            final Map<String, Object> p = new HashMap<String, Object>();
            TransportConfiguration tc;


            p.put(TransportConstants.HOST_PROP_NAME, "localhost");
            tc = new TransportConfiguration(NettyConnectorFactory.class.getName(), p);

            connectionFactory = HornetQJMSClient.createConnectionFactoryWithoutHA(JMSFactoryType.TOPIC_CF, tc);
            //}
            destination = (Destination) context.lookup("jms/queue/test");
            context.close();
            connection = connectionFactory.createConnection("quickstartUser","quickstartPassword");
            session = connection.createSession(false, Session.DUPS_OK_ACKNOWLEDGE);
            messageProducer = session.createProducer(destination);
            consumer = session.createConsumer(destination);
            connection.start();
        }
        //System.out.println("connection " + connection.toString());
    }

    public int storeMessage(String url, String taskName, String uuid, String email){
        startTimer();

        try {
            setupJMS();

            MapMessage message = session.createMapMessage();
            message.setString("url",url);
            message.setString("taskName", taskName);
            message.setString("uuid",uuid);
            message.setString("email",email);
            System.out.println("before message sent===");
            messageProducer.send(message);
            System.out.println("message sent===========> uuid= " + uuid + " email=" + email + " url=" + url);
            incomingMsgs++;

        } catch (JMSException e) {
            e.printStackTrace();
        } catch (NamingException e) {
            e.printStackTrace();
        }

        return incomingMsgs;
    }

    public String runTest(){
        //Map<String,String> tempMap = null;
        done = false;

        String url = "";
        String cached = "false";
        String random = "";
        String email = "";

        HashMap<String,String> tempMap = new HashMap<String, String>();
        String taskName = "performance";
        MapMessage message = null;
        if(incomingMsgs == 0){
//            System.out.println("---------->closing connection");
            try {
                if (context != null) {
                    context.close();
                    context = null;
                }
                // closing the connection takes care of the session, producer, and consumer
                if (connection != null) {
                    connection.close();
                }
            } catch (NamingException e) {
                e.printStackTrace();
            } catch (JMSException e) {
                e.printStackTrace();
            }
            done = true;
        }else{

            try {
                setupJMS();
                message = (MapMessage)consumer.receive(0);
                url = message.getString("url");
                taskName = message.getString("taskName");
                random = message.getString("uuid");
                email = message.getString("email");
                System.out.println("JMS received for: " + url + "--" + taskName + "--" + random + "--" + incomingMsgs);
                //tempMap = ((HashMap)message.getObject("tempMap"));
                incomingMsgs--;

                //running = true;

            } catch (NamingException e) {
                e.printStackTrace();
            } catch (JMSException e) {
                e.printStackTrace();
            } catch (Exception e) {
                e.printStackTrace();
                timer = null;
            }


            //System.out.println("---" + url);


            try
            {

                for(int i = 0; i <= 5; i++) {
                    System.out.println("--------------phantomjs --disk-cache=no --ssl-protocol=any --ignore-ssl-errors=yes speedgun/speedgun.js "+ url +" "+ taskName +" json " + random );
                    Process p=Runtime.getRuntime().exec("phantomjs --disk-cache=no --ssl-protocol=any --ignore-ssl-errors=yes speedgun/speedgun.js "+ url +" "+ taskName +" json " + random );

                  String line;
                    BufferedReader in = new BufferedReader(
                        new InputStreamReader(p.getInputStream()) );
                    while ((line = in.readLine()) != null) {
                      System.out.println(line);
                    }
                    in.close();

                    p.waitFor();

                    Thread.sleep(2000);
//                    BufferedReader reader=new BufferedReader(new InputStreamReader(p.getInputStream()));
//                    String line=reader.readLine();
//                    while(line!=null)
//                    {
//                        line=reader.readLine();
//                    }
                }

                if(email != null){
                    if(!email.isEmpty()){
                        sendMessage(email,random);
                    }
                }
            }
            catch(IOException e1) {
                e1.printStackTrace();
                return "#fail";
            }
            catch(InterruptedException e2) {e2.printStackTrace();}

            System.out.println("Done : " + random);
            done = true;
        }

        return random;
    }

    private synchronized int size(){
        ClientSession coreSession = null;
        int count = 0;
        try {
            HashMap<String, Object> map = new HashMap<String, Object>();
            map.put("host", "localhost");
            map.put("port", 4447);
            ServerLocator serverLocator = HornetQClient.createServerLocatorWithoutHA(new TransportConfiguration(NettyConnectorFactory.class.getName(), map));
            ClientSessionFactory sf = serverLocator.createSessionFactory();
            ClientSession session = sf.createSession(false, false, false);
            ClientRequestor requestor = new ClientRequestor(session, "hornetq.management");
            ClientMessage m = session.createMessage(false);
            ManagementHelper.putAttribute(m, "core.queue.test", "messageCount");
            ClientMessage reply = requestor.request(m);
            count = (Integer) ManagementHelper.getResult(reply);
            return count;
        } catch (HornetQException e) {
            e.printStackTrace();
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            if (coreSession!= null ){
                try {
                    coreSession.close();
                } catch (HornetQException e) {
                    e.printStackTrace();
                }
            }
        }
        return count;
    }
}
