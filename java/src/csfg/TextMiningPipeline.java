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

	public static void main(String[] args) throws GateException, IOException, InterruptedException {
    TextMiningPipeline g = new TextMiningPipeline();
    g.init(args[0]);
    g.processFile(args[1]);
    String doc = g.getDocResult();
    System.out.println(g.getMapResult());
    writeFile(doc, "/tmp/sample.html");
	}
	
	public void init(String config) throws GateException, IOException {
		File gateHome = null, xgappHome = null, xgappPluginsHome = null, siteConfigFile = null;
		
		try {
      Properties properties = new Properties();
      InputStream input = new FileInputStream(config);
      properties.load(input);
			gateHome = new File(properties.getProperty("lib.home"));
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

	public void processFile(String fileName) throws ResourceInstantiationException, ExecutionException, IOException {
		System.out.println("Processing document " + fileName);
		File docFile = new File(fileName);
		Document doc = addAnnotations(docFile);
		String text = doc.getContent().toString();
		mapResult = new MapList();
		Set<Annotation> docAnnos = new HashSet<Annotation>();
		// iterate through desired annotation types, extracting from doc annotations		
		for (String type :  doc.getAnnotations().getAllTypes())  {
			if (type != null) {
				if ((annoConfig.annotationTypesToWrite != null && annoConfig.annotationTypesToWrite.contains(type))){
//				if ((annotationTypesToWrite != null && annotationTypesToWrite.contains(type))
//						|| (annotationTypesToWrite == null && (!"Token".equals(type) && !"Sentence".equals(type) && !"SpaceToken".equals(type) && !"Split".equals(type) && !"Document".equals(type) && !"NP".equals(type) && !"AccessionNumber".equals(type)))) {
//					
					AnnotationSet as = doc.getAnnotations().get(type);
					for (Annotation a : as) {
						String t = text.substring((int) (long) a.getStartNode().getOffset(), (int) (long) a.getEndNode().getOffset());
						//System.out.print(t);
						docAnnos.add(a);
						mapResult.put(type, t);
					}
				}
			}
		}
		docResult = doc.toXml(docAnnos, true);
		corpus.remove(doc);
		Factory.deleteResource(doc);
	}

	public String getDocResult() {
		return docResult;
	}
	
	public MapList getMapResult() {
		return mapResult;
	}
	
	Document addAnnotations(File docFile) throws ResourceInstantiationException, MalformedURLException, ExecutionException {
		Document doc = Factory.newDocument(docFile.toURL(), encoding);
		//doc.setPreserveOriginalContent(true);
		doc.setMarkupAware(true);
		corpus.add(doc);
		application.execute();

		corpus.clear();
		return doc;
	}
	
	public void processText(String text) throws ResourceInstantiationException, ExecutionException, IOException {
		File docFile = File.createTempFile("sample", ".html");
		//f.deleteOnExit();
		String tmp = docFile.toString();
		writeFile("<html><body>" +text + "</body></html>", tmp);
		processFile(tmp);
	}
	
	public static void writeFile(String txt, String outfile) throws IOException {
		FileWriter fw = new FileWriter(outfile);
		BufferedWriter out = new BufferedWriter(fw);
		out.write(txt);
		out.close();
	}
}

// Configure what annotations and features
class AnnotationConfig {

  // list of specific annotation types to write out
  // TODO read from a property file
  public List<String> annotationTypesToWrite = new ArrayList<String>(); {
    annotationTypesToWrite.add("AccessionNumber");  // parent
    annotationTypesToWrite.add("ActivityAssayConditions");  // parent, sentence
    annotationTypesToWrite.add("Characterization"); // parent, sentence
    annotationTypesToWrite.add("ECnumber"); // parent
    annotationTypesToWrite.add("Enzyme"); // parent
    annotationTypesToWrite.add("Expression"); // parent, sentence
    annotationTypesToWrite.add("Family"); // parent
    annotationTypesToWrite.add("Fungus"); // child: Organism > Fungus
    annotationTypesToWrite.add("Gene"); // parent
    annotationTypesToWrite.add("GlycosideHydrolase"); // child: Enzyme > GlycosideHydrolase 
    annotationTypesToWrite.add("Kinetics"); // parent, sentence
    annotationTypesToWrite.add("Laccase");  // child: Enzyme > Laccase
    annotationTypesToWrite.add("Lipase"); // child: Enzyme > Lipase
    annotationTypesToWrite.add("Organism"); // parent
    annotationTypesToWrite.add("Peroxidase"); // child: Enzyme > Peroxidase
    annotationTypesToWrite.add("pH"); // parent, sentence
//    annotationTypesToWrite.add("ProductAnalysis");
    annotationTypesToWrite.add("SpecificActivity");// parent, sentence  
    annotationTypesToWrite.add("Substrate");  // parent
//    annotationTypesToWrite.add("SubstrateSpecificity"); // parent, sentence
    annotationTypesToWrite.add("Temperature");  // parent, sentence
  }

  // annotation level
  public Boolean includeFeatures = false;

}
