package com.fluxui.jms;

/**
 * Created with IntelliJ IDEA.
 * User: wesleyhales
 * Date: 8/9/12
 * Time: 7:16 PM
 * To change this template use File | Settings | File Templates.
 */
import java.util.HashMap;
import java.util.Map;
import java.util.logging.Logger;
import java.util.Properties;

import javax.enterprise.context.ApplicationScoped;
import javax.jms.*;
import javax.naming.Context;
import javax.naming.InitialContext;

@ApplicationScoped
public class PerfJMSClient {
    private static final Logger log = Logger.getLogger(PerfJMSClient.class.getName());

    // Set up all the default values
    private static final String DEFAULT_MESSAGE = "Hello, World!";
    private static final String DEFAULT_CONNECTION_FACTORY = "jms/RemoteConnectionFactory";
    private static final String DEFAULT_DESTINATION = "jms/queue/test";
    private static final String DEFAULT_MESSAGE_COUNT = "1";
    private static final String DEFAULT_USERNAME = "quickstartUser";
    private static final String DEFAULT_PASSWORD = "quickstartPassword";
    private static final String INITIAL_CONTEXT_FACTORY = "org.jboss.naming.remote.client.InitialContextFactory";
    private static final String PROVIDER_URL = "remote://localhost:4447";

    ConnectionFactory connectionFactory = null;
    Connection connection = null;
    Session session = null;
    MessageProducer producer = null;
    MessageConsumer consumer = null;
    Destination destination = null;

    private int incomingMsgs = 0;

    Context context = null;
    final Properties env = new Properties();

    public void init() throws Exception {

        try {
            // Set up the context for the JNDI lookup

            env.put(Context.INITIAL_CONTEXT_FACTORY, INITIAL_CONTEXT_FACTORY);
            env.put(Context.PROVIDER_URL, System.getProperty(Context.PROVIDER_URL, PROVIDER_URL));
            env.put(Context.SECURITY_PRINCIPAL, System.getProperty("username", DEFAULT_USERNAME));
            env.put(Context.SECURITY_CREDENTIALS, System.getProperty("password", DEFAULT_PASSWORD));
            context = new InitialContext(env);

            // Perform the JNDI lookups
            String connectionFactoryString = System.getProperty("connection.factory", DEFAULT_CONNECTION_FACTORY);
            log.info("Attempting to acquire connection factory \"" + connectionFactoryString + "\"");
            connectionFactory = (ConnectionFactory) context.lookup(connectionFactoryString);
            log.info("Found connection factory \"" + connectionFactoryString + "\" in JNDI");

            String destinationString = System.getProperty("destination", DEFAULT_DESTINATION);
            log.info("Attempting to acquire destination \"" + destinationString + "\"");
            destination = (Destination) context.lookup(destinationString);
            log.info("Found destination \"" + destinationString + "\" in JNDI");

            // Create the JMS connection, session, producer, and consumer
            connection = connectionFactory.createConnection(System.getProperty("username", DEFAULT_USERNAME), System.getProperty("password", DEFAULT_PASSWORD));
            session = connection.createSession(false, Session.AUTO_ACKNOWLEDGE);
            producer = session.createProducer(destination);
            consumer = session.createConsumer(destination);
            connection.start();
        } catch (Exception e) {
        log.severe(e.getMessage());
        throw e;
        } finally {
            if (context != null) {
                context.close();
            }

            // closing the connection takes care of the session, producer, and consumer
            if (connection != null) {
                connection.close();
            }
        }
    }

        public void sendMessage(Map amessage) throws JMSException {
            MapMessage m = session.createMapMessage();
            m.setStringProperty("url",(String)amessage.get("url"));
            m.setStringProperty("cached",(String)amessage.get("cached"));

            int count = Integer.parseInt(System.getProperty("message.count", DEFAULT_MESSAGE_COUNT));
            String content = System.getProperty("message.content", DEFAULT_MESSAGE);

            log.info("Sending " + count + " messages with content: " + content);

            // Send the specified number of messages
            for (int i = 0; i < count; i++) {
                //session.createMapMessage(nmessage);
                producer.send(m);
            }
        }

        public Map receiveMessage() throws JMSException {
            // Then receive the same number of messaes that were sent
            //for (int i = 0; i < count; i++) {
                MapMessage message = (MapMessage) consumer.receive(5000);
                log.info("Received message with content " + message.toString());
            //}
            return new HashMap();
        }

    }

