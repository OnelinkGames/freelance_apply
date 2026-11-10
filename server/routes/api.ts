import express from "express";
import * as projectService from "../services/projectService.js";
import * as commentService from "../services/commentService.js";
import * as documentService from "../services/documentService.js";
import * as conversationService from "../services/conversationService.js";
import * as aiService from "../services/aiService.js";
import * as costTrackerService from "../services/costTrackerService.js";
import * as agentService from "../services/agentService.js";
import type { AICostProcess } from "../services/costTrackerService.js";
import type { AgentProcess } from "../lib/agentDefaults.js";
import { getPublicEnvConfig } from "../lib/config.js";
import { calculateTokenCosts } from "../lib/modelPricing.js";
import { resolvePromptTemplate } from "../lib/promptTemplate.js";
import { getAppDataDir } from "../lib/fs.js";
import * as aiSettingsService from "../services/aiSettingsService.js";

export const router = express.Router();

router.get("/config", (_req, res) => {
  res.json(getPublicEnvConfig());
});

router.get("/config/ai", (_req, res) => {
  res.json(aiSettingsService.getPublicAISettings());
});

router.put("/config/ai", (req, res, next) => {
  try {
    const settings = aiSettingsService.updateAISettings({
      apiKey: req.body.apiKey,
      clearApiKey: Boolean(req.body.clearApiKey),
      defaultModel: req.body.defaultModel,
      usdToBrl: req.body.usdToBrl !== undefined ? Number(req.body.usdToBrl) : undefined,
    });
    aiService.resetAIClient();
    res.json(settings);
  } catch (error) {
    next(error);
  }
});

router.get("/config/ai/models", async (_req, res, next) => {
  try {
    const models = await aiSettingsService.listAvailableModels();
    res.json({ models });
  } catch (error) {
    next(error);
  }
});

router.get("/config/data-dir", (_req, res) => {
  res.json({ path: getAppDataDir() });
});

router.post("/config/test", async (req, res, next) => {
  try {
    aiService.resetAIClient();
    const result = await aiService.testConnection({
      apiKey: typeof req.body?.apiKey === "string" ? req.body.apiKey : undefined,
      model: typeof req.body?.model === "string" ? req.body.model : undefined,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get("/columns", (_req, res) => {
  res.json(projectService.listColumns());
});

router.get("/projects", (_req, res) => {
  res.json(projectService.listProjects());
});

router.get("/projects/:id", (req, res) => {
  const project = projectService.getProject(req.params.id);
  if (!project) {
    res.status(404).json({ message: "Projeto não encontrado" });
    return;
  }
  res.json(project);
});

router.post("/projects", (req, res, next) => {
  try {
    const project = projectService.createProject(req.body);
    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
});

router.patch("/projects/:id", (req, res, next) => {
  try {
    const project = projectService.updateProject(req.params.id, req.body);
    res.json(project);
  } catch (error) {
    next(error);
  }
});

router.post("/projects/:id/move", (req, res, next) => {
  try {
    const project = projectService.moveProject(req.params.id, req.body.targetColumn);
    res.json(project);
  } catch (error) {
    next(error);
  }
});

router.delete("/projects/:id", (req, res) => {
  projectService.deleteProject(req.params.id);
  res.status(204).send();
});

router.get("/projects/:projectId/comments", (req, res) => {
  res.json(commentService.listComments(req.params.projectId));
});

router.post("/projects/:projectId/comments", (req, res, next) => {
  try {
    const comment = commentService.addComment(req.params.projectId, req.body.text);
    res.status(201).json(comment);
  } catch (error) {
    next(error);
  }
});

router.delete("/comments/:id", (req, res) => {
  commentService.deleteComment(req.params.id);
  res.status(204).send();
});

router.get("/projects/:projectId/documents", (req, res) => {
  res.json(documentService.listDocuments(req.params.projectId));
});

router.get("/projects/:projectId/documents/latest/:type", (req, res) => {
  const doc = documentService.getLatestDocument(
    req.params.projectId,
    req.params.type as documentService.DocumentType,
  );
  res.json(doc);
});

router.post("/projects/:projectId/documents", (req, res, next) => {
  try {
    const doc = documentService.saveDocument(
      req.params.projectId,
      req.body.type,
      req.body.content,
    );
    res.status(201).json(doc);
  } catch (error) {
    next(error);
  }
});

router.get("/projects/:projectId/conversations/:columnSlug", (req, res) => {
  const conversation = conversationService.getOrCreateConversation(
    req.params.projectId,
    req.params.columnSlug,
  );
  res.json(conversation);
});

router.get("/conversations/:id/messages", (req, res) => {
  res.json(conversationService.listMessages(req.params.id));
});

router.post("/conversations/:id/messages", (req, res, next) => {
  try {
    const message = conversationService.addMessage(
      req.params.id,
      req.body.role,
      req.body.content,
    );
    res.status(201).json(message);
  } catch (error) {
    next(error);
  }
});

router.post("/conversations/:id/chat", async (req, res, next) => {
  try {
    const conversation = conversationService.getConversationById(req.params.id);
    if (!conversation) {
      res.status(404).json({ message: "Conversa não encontrada" });
      return;
    }

    const process = agentService.processFromColumnSlug(conversation.columnSlug);
    const resolved = agentService.resolveAgentForProject(process, conversation.projectId);

    const history = conversationService.listMessages(req.params.id);
    const userMessage = conversationService.addMessage(req.params.id, "user", req.body.content);

    const result = await aiService.chatComplete(
      [...history, userMessage],
      {
        systemPrompt: req.body.systemPrompt ?? resolved.systemPrompt,
        temperature: resolved.agent.temperature,
        maxTokens: resolved.agent.maxTokens,
        model: resolved.agent.model,
        provider: resolved.agent.provider,
      },
      { projectId: conversation.projectId, process },
    );

    const assistantMessage = conversationService.addMessage(
      req.params.id,
      "assistant",
      result.content,
    );

    res.json(assistantMessage);
  } catch (error) {
    next(error);
  }
});

router.get("/projects/:projectId/milestones", (req, res) => {
  res.json(conversationService.listMilestones(req.params.projectId));
});

router.put("/projects/:projectId/milestones", (req, res, next) => {
  try {
    const milestones = conversationService.replaceMilestones(req.params.projectId, req.body);
    res.json(milestones);
  } catch (error) {
    next(error);
  }
});

router.post("/ai/complete", async (req, res, next) => {
  try {
    if (!req.body.projectId || !req.body.process) {
      res.status(400).json({ message: "projectId e process são obrigatórios" });
      return;
    }

    const process = req.body.process as AgentProcess;
    const resolved = agentService.resolveAgentForProject(process, req.body.projectId);

    const mode = req.body.mode as "default" | "generation" | "preview" | undefined;
    let systemPrompt = resolved.systemPrompt;
    let userPrompt = req.body.prompt ?? "Prossiga conforme suas instruções.";

    if (mode === "generation" && resolved.generationPrompt) {
      systemPrompt = resolved.generationPrompt;
    } else if (mode === "preview" && resolved.previewPrompt) {
      systemPrompt = resolved.previewPrompt;
    }

    const result = await aiService.complete(
      userPrompt,
      {
        systemPrompt: req.body.systemPrompt ?? systemPrompt,
        temperature: req.body.temperature ?? resolved.agent.temperature,
        maxTokens: resolved.agent.maxTokens,
        model: resolved.agent.model,
        provider: resolved.agent.provider,
      },
      {
        projectId: req.body.projectId,
        process: process as AICostProcess,
      },
    );
    res.json({ content: result.content, usage: result.usage });
  } catch (error) {
    next(error);
  }
});

router.get("/agents", (_req, res) => {
  res.json(agentService.listAgents());
});

router.get("/agents/process/:process", (req, res) => {
  const agent = agentService.getAgentByProcess(req.params.process as AgentProcess);
  if (!agent) {
    res.status(404).json({ message: "Agente não encontrado" });
    return;
  }
  res.json(agent);
});

router.get("/agents/:id", (req, res) => {
  const agent = agentService.getAgentById(req.params.id);
  if (!agent) {
    res.status(404).json({ message: "Agente não encontrado" });
    return;
  }
  res.json(agent);
});

router.get("/agents/:id/export", (req, res, next) => {
  try {
    const markdown = agentService.exportAgentPrompt(req.params.id);
    res.setHeader("Content-Type", "text/markdown; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${req.params.id}.md"`);
    res.send(markdown);
  } catch (error) {
    next(error);
  }
});

router.patch("/agents/:id", (req, res, next) => {
  try {
    const agent = agentService.updateAgent(req.params.id, req.body);
    res.json(agent);
  } catch (error) {
    next(error);
  }
});

router.post("/agents/:id/restore", (req, res, next) => {
  try {
    const agent = agentService.restoreAgentDefaults(req.params.id);
    res.json(agent);
  } catch (error) {
    next(error);
  }
});

router.post("/agents/:id/import", (req, res, next) => {
  try {
    if (!req.body.markdown) {
      res.status(400).json({ message: "markdown é obrigatório" });
      return;
    }
    const agent = agentService.importAgentPromptFromMarkdown(req.params.id, req.body.markdown);
    res.json(agent);
  } catch (error) {
    next(error);
  }
});

router.post("/agents/:id/test", async (req, res, next) => {
  try {
    const agent = agentService.getAgentById(req.params.id);
    if (!agent) {
      res.status(404).json({ message: "Agente não encontrado" });
      return;
    }

    const sampleInput = req.body.sampleInput ?? "Texto de exemplo para teste.";
    const context = req.body.projectId
      ? agentService.buildProjectContext(req.body.projectId)
      : {
          project_name: "Projeto de Teste",
          initial_spec: sampleInput,
          documents: sampleInput,
        };

    const finalPrompt = resolvePromptTemplate(agent.systemPrompt, context);

    const result = await aiService.complete(
      sampleInput,
      {
        systemPrompt: finalPrompt,
        temperature: agent.temperature,
        maxTokens: agent.maxTokens,
        model: agent.model,
        provider: agent.provider,
      },
      req.body.projectId
        ? { projectId: req.body.projectId, process: agent.process as AICostProcess }
        : undefined,
    );

    const costs = calculateTokenCosts(
      result.usage.model,
      result.usage.inputTokens,
      result.usage.outputTokens,
    );

    res.json({
      finalPrompt,
      response: result.content,
      usage: result.usage,
      estimatedCostBRL: costs.totalCost,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/ai-costs/dashboard", (_req, res) => {
  res.json(costTrackerService.getDashboard());
});

router.get("/ai-costs/history", (req, res) => {
  const limit = Number(req.query.limit ?? 100);
  res.json(costTrackerService.listHistory(limit));
});
