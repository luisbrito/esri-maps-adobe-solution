package com.dataeast.aiauthtest;

import java.io.*;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import java.util.HashMap;

/**
 * Servlet implementation class AiAuthTest
 */
@WebServlet("/AiAuthTest")
public class AiAuthTest extends HttpServlet {
	private class AuthorizeResponse{
		public boolean state;
		public String token;
		public String validTime;
		public String userId;
	}
	private HashMap<String, AuthorizeResponse> requestMap = null;
	private static final long serialVersionUID = 1L;
       
    /**
     * @see HttpServlet#HttpServlet()
     */
    public AiAuthTest() {
        super();
        // TODO Auto-generated constructor stub
    }

	/**
	 * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		if (requestMap == null)
			requestMap = new HashMap<String,AuthorizeResponse>();
		String id = request.getParameter("id");
		response.setContentType("application/json");
		PrintWriter out = response.getWriter();
		out.println("{");
		if (id == null)
		{
			out.println("\t\"error\":\"No ID\"");
			out.println("}");
			return;
		}
		String action = request.getParameter("action");
		if (action == null)
		{
			out.println("\t\"error\":\"No action\"");
			out.println("}");
			return;
		}
		boolean isEmpty = requestMap.isEmpty();
		if (isEmpty && (!action.equalsIgnoreCase("add")))
		{
			out.println("\t\"error\":\"queue is empty\"");
			out.println("}");
			return;
		}
		if (action.equalsIgnoreCase("add"))
		{
			if (!isEmpty)
			{
				if(requestMap.containsKey(id))
				{
					out.println("\t\"error\":\"ID is in queue\"");
					out.println("}");
					return;
				}
			}
			AuthorizeResponse resp = new AuthorizeResponse();
			resp.state = false;
			requestMap.put(id, resp);
			out.println("\t\"error\":\"No\"");
			out.println("}");
			return;
		}
		AuthorizeResponse resp = requestMap.get(id);
		if (resp == null)
		{
			out.println("\t\"error\":\"ID is not in queue\"");
			out.println("}");
			return;
		}
		if (action.equalsIgnoreCase("check"))
		{
			out.println("\t\"error\":\"No\",");
			String state = "\t\"state\":\"";
			if (resp.state)
				state += "ready\"";
			else
				state += "in queue\"";
			out.println(state);
			out.println("}");
			return;
		}
		if (action.equalsIgnoreCase("refresh"))
		{
			resp.state = true;
			String tok = request.getParameter("access_token");
			if (tok == null)
			{
				resp.token = "no token";
				resp.validTime = "";
				resp.userId = "";
				out.println("\t\"error\":\"No token\"");
			}
			else
			{
				out.println("\t\"error\":\"No\"");
				resp.token = tok;
				String vt = request.getParameter("expires_in");
				if (vt == null)
					resp.validTime = "";
				else
					resp.validTime = vt;
				String user = request.getParameter("username");
				if (user == null)
					resp.userId = "";
				else
					resp.userId = user;
			}
			requestMap.put(id, resp);
			out.println("}");
			return;
		}
		if (action.equalsIgnoreCase("abort"))
		{
			requestMap.remove(id);
			out.println("\t\"error\":\"No\"");
			out.println("}");
			return;
		}
		if (!action.equalsIgnoreCase("get"))
		{
			out.println("\t\"error\":\"No such action\"");
			out.println("}");
			return;
		}
		if (!resp.state)
		{
			out.println("\t\"error\":\"No\",");
			out.println("\t\"state\":\"not ready\"");
			out.println("}");
			return;
		}
		if (resp.token.equalsIgnoreCase("no token"))
		{
			out.println("\t\"error\":\"No token\",");
			out.println("\t\"state\":\"ready\"");
			out.println("}");
		}
		else
		{
			out.println("\t\"error\":\"No\",");
			out.println("\t\"state\":\"ready\",");
			String sOut = "\t\"token\":\"";
			sOut += resp.token;
			sOut += "\",";
			out.println(sOut);
			sOut = "\t\"expires_in\":\"";
			sOut += resp.validTime;
			sOut += "\",";
			out.println(sOut);
			sOut = "\t\"user\":\"";
			sOut += resp.userId;
			sOut += "\"";
			out.println(sOut);
			out.println("}");
		}
		requestMap.remove(id);
	}

	/**
	 * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		doGet(request, response);
	}

}
