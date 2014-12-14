package com.fluxui.service;

import org.codehaus.jackson.map.ObjectMapper;
import org.eclipse.jetty.websocket.api.Session;
import org.hornetq.utils.json.JSONException;
import org.hornetq.utils.json.JSONObject;
import org.jboss.resteasy.client.jaxrs.ResteasyClient;
import org.jboss.resteasy.client.jaxrs.ResteasyClientBuilder;
import org.jboss.resteasy.client.jaxrs.ResteasyWebTarget;

import javax.enterprise.context.ApplicationScoped;
import javax.enterprise.context.RequestScoped;
import javax.json.Json;
import javax.json.JsonObject;
import javax.json.JsonReader;
import javax.validation.ConstraintViolationException;
import javax.validation.ValidationException;
import javax.ws.rs.*;

import javax.ws.rs.client.Client;
import javax.ws.rs.client.ClientBuilder;
import javax.ws.rs.client.Entity;
import javax.ws.rs.client.WebTarget;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import java.io.*;
import java.util.HashMap;
import java.util.Map;

/**
 * Created by wesleyhales on 12/13/14.
 */
@Path("/beacon")
@ApplicationScoped
public class BeaconService {


  Map<String, SGStatus> sessionMap = new HashMap<String, SGStatus>();

  @POST
  @Path("/receive")
  @Consumes(MediaType.APPLICATION_JSON)
  @Produces(MediaType.APPLICATION_JSON)
  public Response receive(SGStatus sgstatus) {

    //process the message for in memory list
    //get JSON
    //store in list

    Response.ResponseBuilder response = null;

      //Create an "ok" response
    response = Response.ok("{\"status\":\"msg received from: " + sgstatus.getIp() + "\"}", MediaType.APPLICATION_JSON);


    System.out.println("----server received msg from: " + sgstatus.getIp());


    sessionMap.put(sgstatus.getIp(), sgstatus);
    //need a timer... or check on page load and then call purge if not available

    System.out.println("----sessionMap size: " + sessionMap.size());

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


    return response.build();
  }



}


