package com.fluxui.service;


import org.codehaus.jackson.map.ObjectMapper;
import org.eclipse.jetty.websocket.api.Session;
import org.hornetq.utils.json.JSONException;
import org.hornetq.utils.json.JSONObject;
import org.jboss.resteasy.client.jaxrs.ResteasyClient;
import org.jboss.resteasy.client.jaxrs.ResteasyClientBuilder;
import org.jboss.resteasy.client.jaxrs.ResteasyWebTarget;

import javax.annotation.PostConstruct;
import javax.enterprise.context.ApplicationScoped;
import javax.enterprise.context.RequestScoped;
import javax.inject.Inject;
import javax.json.Json;
import javax.json.JsonObject;
import javax.json.JsonReader;
import javax.servlet.http.HttpServletRequest;
import javax.validation.ConstraintViolationException;
import javax.validation.ValidationException;
import javax.ws.rs.*;

import javax.ws.rs.client.Client;
import javax.ws.rs.client.ClientBuilder;
import javax.ws.rs.client.Entity;
import javax.ws.rs.client.WebTarget;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import java.io.*;
import java.lang.management.OperatingSystemMXBean;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.*;
import java.util.logging.Logger;

/**
 * Created by wesleyhales on 12/13/14.
 */
@Path("/beacon")
@ApplicationScoped
public class BeaconService {

  @Inject
  private transient Logger log;

  @PostConstruct
  public void initialize() {
    log.info("Start the beacon timer");
    startBeaconTimer();
  }

  private Timer timer = null;

  private void startBeaconTimer(){
    if(timer == null) {
      timer = new Timer();
      log.info("+++beacon timer is null");

      timer.schedule(new TimerTask() {
        public void run() {
          // do stuff
          transmit();
          log.info("+++beacon timer is running");

        }
      }, 0, 60000);
    }
  }

  private void stopBeaconTimer(){
    timer = null;
  }

  private JsonObject readJSON(String data) {
    log.info("------data-" + data);
    JsonReader reader = Json.createReader(new StringReader(data));
    JsonObject myObject = reader.readObject();
    reader.close();
    return myObject;
  }

  private SGStatus sgStatus = new SGStatus();

  private String addr;

  public void transmit() {


    Client client = ClientBuilder.newBuilder().build();
    WebTarget target = client.target("http://107.170.209.199/rest/beacon/receive");

    //post the data
    //time,cpu,etc...
    try {
      getSystemInfo();
    } catch (Exception e) {
      log.severe("Problem getting system info.");
      e.printStackTrace();
    }



//    if(addr == null){
//        try {
//            addr = InetAddress.getLocalHost().getHostAddress();
//        } catch (UnknownHostException e) {
//            log.severe("can't get IP address, falling back to local");
//            addr = "0.0.0.0";
//        }
//    }

    sgStatus.setIp("0.0.0.0");

    sgStatus.setTimestamp(new Date().getTime());

    ObjectMapper mapper = new ObjectMapper();
    String input = null;
    try {
      input = mapper.writeValueAsString(sgStatus);
    } catch (IOException e) {
      e.printStackTrace();
    }

    Response response = target.request().post(Entity.entity(input, "application/json"));

    //parse the response.. let the user know if port 8081 is blocked
//    JsonObject askObject = readJSON(response.readEntity(String.class));

    response.close();


  }



  private void getSystemInfo(){
     /* Total number of processors or cores available to the JVM */

    sgStatus.setAvailableCores(Runtime.getRuntime().availableProcessors());

    /* Total amount of free memory available to the JVM */

    sgStatus.setFreeMemory(Runtime.getRuntime().freeMemory());

    /* This will return Long.MAX_VALUE if there is no preset limit */
    long maxMemory = Runtime.getRuntime().maxMemory();
    /* Maximum amount of memory the JVM will attempt to use */

    sgStatus.setMaxMemory((maxMemory == Long.MAX_VALUE ? 0L : maxMemory));

    /* Total memory currently available to the JVM */

    sgStatus.setTotalMemory(Runtime.getRuntime().totalMemory());

    /* Get a list of all filesystem roots on this system */
    File[] roots = File.listRoots();

    /* For each filesystem root, print some info */
    for (File root : roots) {
      sgStatus.setTotalSpace(root.getTotalSpace());
      sgStatus.setFreeSpace(root.getFreeSpace());
      sgStatus.setUsableSpace(root.getUsableSpace());
    }
  }



  private Map<String, SGStatus> sessionMap = new HashMap<String, SGStatus>();

  @POST
  @Path("/receive")
  @Consumes(MediaType.APPLICATION_JSON)
  @Produces(MediaType.APPLICATION_JSON)
  public Response receive(SGStatus sgstatus, @Context HttpServletRequest req) {

    //process the message for in memory list
    //get JSON
    //store in list

    Response.ResponseBuilder response = null;

      //Create an "ok" response
    response = Response.ok("{\"status\":\"msg received from: " + req.getRemoteHost() + "\"}", MediaType.APPLICATION_JSON);


    log.info("----Beacon received msg from: " + req.getRemoteHost() + " port: " + req.getRemotePort());

    sgstatus.setIp(req.getRemoteHost());
    sessionMap.put(req.getRemoteHost(), sgstatus);
    //need a timer... or check on page load and then call purge if not available

    log.info("----sessionMap size: " + sessionMap.size());

    response.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    response.header("Access-Control-Allow-Origin", "*");
    response.header("Access-Control-Allow-Headers", "accept, origin, ag-mobile-variant, content-type");

    return response.build();

    //handle exceptions
    //send status back to peer
    //could be normal status code

  }

  @GET
  @Path("/getlist")
  @Produces(MediaType.TEXT_HTML)
  public Response getList() {

//    serve list for ui
    Response.ResponseBuilder response = null;

    //Create an "ok" response

//    JSONObject json = new JSONObject();

    ObjectMapper mapper = new ObjectMapper();
    String responseString = null;
    try {
      responseString = mapper.writeValueAsString(sessionMap);
    } catch (IOException e) {
      e.printStackTrace();
    }


//    try {
//      json.put( "sessionMap", sessionMap );
//      System.out.printf("JSON: %s", json.toString());
//      responseString = json.toString(2);
//    } catch (JSONException e) {
//      e.printStackTrace();
//    }


    response = Response.ok(responseString, MediaType.APPLICATION_JSON);
    response.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    response.header("Access-Control-Allow-Origin", "*");
    response.header("Access-Control-Allow-Headers", "accept, origin, ag-mobile-variant, content-type");

    return response.build();
  }

}


