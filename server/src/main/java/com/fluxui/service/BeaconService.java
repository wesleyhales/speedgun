package com.fluxui.service;


import org.codehaus.jackson.map.ObjectMapper;

import javax.annotation.PostConstruct;
import javax.enterprise.context.ApplicationScoped;
import javax.inject.Inject;
import javax.json.Json;
import javax.json.JsonObject;
import javax.json.JsonReader;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.*;
import javax.ws.rs.client.Client;
import javax.ws.rs.client.ClientBuilder;
import javax.ws.rs.client.Entity;
import javax.ws.rs.client.WebTarget;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.io.File;
import java.io.IOException;
import java.io.StringReader;
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
    log.info("[Speedgun] Start the beacon timer");
    startBeaconTimer();
  }

  private Timer timer = null;

  private void startBeaconTimer(){
    if(timer == null) {
      timer = new Timer();
      log.info("[Speedgun] Beacon timer starting");

      timer.schedule(new TimerTask() {
        public void run() {
          // do stuff
          transmit();
          log.info("[Speedgun] Beacon is running");

        }
      }, 0, 60000);
    }
  }

  private void stopBeaconTimer(){
    timer = null;
  }

  private JsonObject readJSON(String data) {
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


    log.info("[Speedgun] Beacon received msg from: " + req.getRemoteHost() + " port: " + req.getRemotePort());

    sgstatus.setIp(req.getRemoteHost());
    sessionMap.put(req.getRemoteHost(), sgstatus);
    //need a timer... or check on page load and then call purge if not available

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

    Response.ResponseBuilder response = null;

    ObjectMapper mapper = new ObjectMapper();
    String responseString = null;
    try {
      responseString = mapper.writeValueAsString(sessionMap);
    } catch (IOException e) {
      e.printStackTrace();
    }

    response = Response.ok(responseString, MediaType.APPLICATION_JSON);
    response.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    response.header("Access-Control-Allow-Origin", "*");
    response.header("Access-Control-Allow-Headers", "accept, origin, ag-mobile-variant, content-type");

    return response.build();
  }

}


