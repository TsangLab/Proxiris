package csfg;

import gate.Annotation;
import gate.AnnotationSet;
import gate.Corpus;
import gate.CorpusController;
import gate.Document;
import gate.Factory;
import gate.Gate;
import gate.creole.ExecutionException;
import gate.creole.ResourceInstantiationException;
import gate.util.GateException;
import gate.util.persistence.PersistenceManager;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.net.MalformedURLException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.io.FileInputStream;
import java.io.InputStream;
import java.util.Properties;

import org.wikifier.MapList;

public class TextMiningPipeline {
	private String encoding = null;
	Corpus corpus;
	CorpusController application;
	private String docResult;
	private MapList mapResult;

	static AnnotationConfig annoConfig = new AnnotationConfig();

  /**
   *
   * When run standalone, uses arg 1 properties file to process arg 2, outputting in /tmp/sample.html
   **/

	public static void main(String[] args) throws GateException, IOException, InterruptedException {
    TextMiningPipeline g = new TextMiningPipeline();
    g.init(args[0]);
    g.processFile(args[1]);
    String doc = g.getDocResult();
    System.out.println(g.getMapResult());
    writeFile(doc, "/tmp/sample.html");
	}
	
  /**
   *
   * initialize wtih properties file
   *
   **/
	public void init(String config) throws GateException, IOException {
    System.out.println("init from " + System.getProperty("user.dir"));
		File gateHome = null, xgappHome = null, xgappPluginsHome = null, siteConfigFile = null;
		
		try {
      Properties properties = new Properties();
      InputStream input = new FileInputStream(config);
      properties.load(input);
			gateHome = new File(properties.getProperty("libs.home"));
			xgappHome = new File(properties.getProperty("xgapp.location"));
			xgappPluginsHome = new File(properties.getProperty("xgapp.plugins.location"));
			siteConfigFile = new File(properties.getProperty("gate.site.config.location"));
		} catch (IOException ex) {
      System.err.println("could not read properties file " + config);
			throw ex;
		}
		System.out.println("initializing with gate.home: " + gateHome + " -- xgapp.location: " + xgappHome + " -- xgapp.plugins.location: " + xgappPluginsHome + " -- gate.site.config.location: " + siteConfigFile + "\n" + System.getProperty("gate.home"));
		Gate.setGateHome(gateHome);
		Gate.setPluginsHome(xgappPluginsHome);
		Gate.setSiteConfigFile(siteConfigFile);

		Gate.init();
		application = (CorpusController) PersistenceManager.loadObjectFromFile(xgappHome);
		corpus = Factory.newCorpus("BatchProcessApp Corpus");
		application.setCorpus(corpus);
 	}


  /**
   *
   * process an HTML file adding all annotations
   *
   **/

	public void processFile(String fileName) throws ResourceInstantiationException, ExecutionException, IOException {
		System.out.println("Processing document " + fileName);
		File docFile = new File(fileName);
		Document doc = addAnnotations(docFile);
		String text = doc.getContent().toString();
		mapResult = new MapList();
		Set<Annotation> docAnnos = new HashSet<Annotation>();
		for (String type :  doc.getAnnotations().getAllTypes())  {
			if (type != null) {
        AnnotationSet as = doc.getAnnotations().get(type);
        for (Annotation a : as) {
          String t = text.substring((int) (long) a.getStartNode().getOffset(), (int) (long) a.getEndNode().getOffset());
          docAnnos.add(a);
          mapResult.put(type, t);
        }
			}
		}
		docResult = doc.toXml(docAnnos, true);
		corpus.remove(doc);
		Factory.deleteResource(doc);
	}

  /**
   *
   * Retrieve the HTML document result with inline annotations
   *
   **/
	public String getDocResult() {
		return docResult;
	}
 
  /**
   *
   * Get a map of annotations
   *
   **/
	
	public MapList getMapResult() {
		return mapResult;
	}
	
  /**
   *
   * Actually add the annotations
   *
   **/

	Document addAnnotations(File docFile) throws ResourceInstantiationException, MalformedURLException, ExecutionException {
		Document doc = Factory.newDocument(docFile.toURL(), encoding);
		//doc.setPreserveOriginalContent(true);
		doc.setMarkupAware(true);
		corpus.add(doc);
		application.execute();

		corpus.clear();
		return doc;
	}
	
  /**
   *
   * Prepare an html snippet for annotation
   *
   **/

	public void processText(String text) throws ResourceInstantiationException, ExecutionException, IOException {
		File docFile = File.createTempFile("sample", ".html");
		//f.deleteOnExit();
		String tmp = docFile.toString();
		writeFile("<html><body>" +text + "</body></html>", tmp);
		processFile(tmp);
	}
	
  /**
   *
   * Helper to write a file
   *
   **/

	public static void writeFile(String txt, String outfile) throws IOException {
		FileWriter fw = new FileWriter(outfile);
		BufferedWriter out = new BufferedWriter(fw);
		out.write(txt);
		out.close();
	}
}
