import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  App as AntdApp,
  Button,
  Card,
  Col,
  Tooltip,
  Form,
  Input,
  Layout,
  List,
  Empty,
  Row,
  Segmented,
  Space,
  Spin,
  Tag,
  Typography,
} from "antd";
import {
  DownloadOutlined,
  EyeOutlined,
  FileAddOutlined,
  InboxOutlined,
  LogoutOutlined,
  CopyOutlined,
  ReloadOutlined,
  SettingOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { API_BASE_URL, ApiError, getErrorMessage } from "@/api/client";
import { getMe, getQuota, login, logout, register } from "@/api/auth";
import { createText, deleteItem, getFileDownloadUrl, getItems, type TimelineItem } from "@/api/items";
import { uploadFileWithBlob } from "@/api/uploads";
import { cacheImageRecord, getCachedImageRecords, removeCachedImage, type CachedImageRecord } from "@/db/sqlite";
import { detectDeviceType, generateDeviceName } from "@/lib/device-name";
import {
  clearSessionState,
  initialSessionState,
  readOrCreateLocalDeviceName,
  readSessionState,
  writeLocalDeviceName,
  writeSessionState,
  type SessionState,
} from "@/store/session";

const { Content } = Layout;
const { Paragraph, Text, Title } = Typography;

type FilterMode = "all" | "text" | "file";
type RouteMode = "login" | "home" | "settings";

type QuotaState = {
  maxFileSizeMb: number;
  maxTotalFileBytes: number;
  maxTotalTextBytes: number;
  fileRetentionDays: number;
  textRetentionDays: number | null;
  secretModeEnabled: boolean;
  fileBytesUsed: number;
  textBytesUsed: number;
};

const emptyQuota: QuotaState = {
  maxFileSizeMb: 10,
  maxTotalFileBytes: 0,
  maxTotalTextBytes: 0,
  fileRetentionDays: 15,
  textRetentionDays: null,
  secretModeEnabled: false,
  fileBytesUsed: 0,
  textBytesUsed: 0,
};

const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("zh-CN", { hour12: false });
}

function DesktopApp() {
  const { message } = AntdApp.useApp();
  const [route, setRoute] = useState<RouteMode>("login");
  const [filter, setFilter] = useState<FilterMode>("all");
  const [session, setSession] = useState<SessionState>(initialSessionState);
  const [deviceType] = useState(detectDeviceType());
  const [deviceName, setDeviceName] = useState(() =>
    readOrCreateLocalDeviceName(() => generateDeviceName(detectDeviceType())),
  );
  const [loadingSession, setLoadingSession] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [textSending, setTextSending] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [quota, setQuota] = useState<QuotaState>(emptyQuota);
  const [cachedImages, setCachedImages] = useState<Record<string, CachedImageRecord>>({});
  const [textDraft, setTextDraft] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [isForeground, setIsForeground] = useState(true);
  const [loadingImageIds, setLoadingImageIds] = useState<Record<string, boolean>>({});
  const [loginForm] = Form.useForm<{ email: string; password: string }>();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const hydrateDashboard = useCallback(
    async (token: string) => {
      const [meResponse, quotaResponse, itemsResponse] = await Promise.all([
        getMe(token),
        getQuota(token),
        getItems(token, filter),
      ]);

      setDeviceName(meResponse.data.device.deviceName);
      writeLocalDeviceName(meResponse.data.device.deviceName);
      setSession((previous) => {
        const next = {
          token,
          email: meResponse.data.user.email,
          deviceName: meResponse.data.device.deviceName,
        };
        writeSessionState(next);
        return next;
      });

      setQuota({
        ...quotaResponse.data.limits,
        ...quotaResponse.data.usage,
      });
      setItems(itemsResponse.data.items);
      setRoute("home");
    },
    [filter],
  );

  useEffect(() => {
    const persisted = readSessionState();
    if (!persisted.token) {
      setLoadingSession(false);
      return;
    }

    hydrateDashboard(persisted.token)
      .catch(() => {
        clearSessionState();
        setSession(initialSessionState);
      })
      .finally(() => setLoadingSession(false));
  }, [hydrateDashboard]);

  const hydrateCachedImages = useCallback(async () => {
    try {
      const records = await getCachedImageRecords();
      setCachedImages(
        records.reduce<Record<string, CachedImageRecord>>((accumulator, record) => {
          accumulator[record.itemId] = record;
          return accumulator;
        }, {}),
      );
    } catch {
      setCachedImages({});
    }
  }, []);

  const effectiveDeviceName = useMemo(
    () => session.deviceName ?? deviceName,
    [deviceName, session.deviceName],
  );

  useEffect(() => {
    const syncForegroundState = () => {
      const isVisible = document.visibilityState === "visible";
      const isFocused = typeof document.hasFocus === "function" ? document.hasFocus() : true;
      setIsForeground(isVisible && isFocused);
    };

    syncForegroundState();
    window.addEventListener("focus", syncForegroundState);
    window.addEventListener("blur", syncForegroundState);
    document.addEventListener("visibilitychange", syncForegroundState);

    return () => {
      window.removeEventListener("focus", syncForegroundState);
      window.removeEventListener("blur", syncForegroundState);
      document.removeEventListener("visibilitychange", syncForegroundState);
    };
  }, []);

  const submitAuth = async (mode: "login" | "register") => {
    const values = await loginForm.validateFields();
    setAuthLoading(true);

    try {
      const payload = {
        email: values.email.trim(),
        password: values.password,
        deviceType,
        deviceName: effectiveDeviceName,
      };

      const response = mode === "login" ? await login(payload) : await register(payload);
      const nextSession: SessionState = {
        token: response.data.token,
        email: response.data.user.email,
        deviceName: response.data.device.deviceName,
      };

      writeSessionState(nextSession);
      setSession(nextSession);
      setDeviceName(response.data.device.deviceName);
      writeLocalDeviceName(response.data.device.deviceName);
      await hydrateDashboard(response.data.token);
      void message.success(mode === "login" ? "登录成功。" : "注册成功。");
    } catch (error) {
      const messageText =
        error instanceof ApiError ? error.message : mode === "login" ? "登录失败。" : "注册失败。";
      void message.error(messageText);
    } finally {
      setAuthLoading(false);
    }
  };

  const refreshDashboard = async (options?: { showIndicator?: boolean; suppressError?: boolean }) => {
    if (!session.token) return;
    if (options?.showIndicator) {
      setRefreshing(true);
    }

    try {
      const [quotaResponse, itemsResponse] = await Promise.all([
        getQuota(session.token),
        getItems(session.token, filter),
      ]);
      setQuota({
        ...quotaResponse.data.limits,
        ...quotaResponse.data.usage,
      });
      setItems(itemsResponse.data.items);
    } catch (error) {
      if (!options?.suppressError) {
        const messageText =
          error instanceof ApiError ? error.message : "刷新失败。";
        void message.error(messageText);
      }
    } finally {
      if (options?.showIndicator) {
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    if (!session.token || route !== "home") return;
    void refreshDashboard({ suppressError: true });
  }, [filter, route, session.token]);

  useEffect(() => {
    if (route !== "home") return;
    void hydrateCachedImages();
  }, [hydrateCachedImages, route]);

  useEffect(() => {
    if (!session.token || route !== "home") return;

    const intervalMs = isForeground ? 5000 : 20000;
    const timer = window.setInterval(() => {
      void refreshDashboard({ suppressError: true });
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [filter, isForeground, route, session.token]);

  const submitText = async () => {
    if (!session.token || !textDraft.trim()) return;
    setTextSending(true);

    try {
      const response = await createText(session.token, textDraft.trim());
      setItems((previous) => [response.data.item, ...previous]);
      setTextDraft("");
      await refreshDashboard({ suppressError: true });
      void message.success("文本已发送。");
    } catch (error) {
      const messageText =
        error instanceof ApiError ? error.message : "发送文本失败。";
      void message.error(messageText);
    } finally {
      setTextSending(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    if (!session.token) return;
    if (file.size > quota.maxFileSizeMb * 1024 * 1024) {
      void message.error(`单个文件不能超过 ${quota.maxFileSizeMb}MB。`);
      return;
    }

    setUploadingFile(true);
    try {
      await uploadFileWithBlob(session.token, file);
      await refreshDashboard({ suppressError: true });
      void message.success("文件已上传。");
    } catch (error) {
      const messageText = getErrorMessage(error, "上传文件失败。");
      void message.error(messageText);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!session.token) return;
    try {
      await deleteItem(session.token, itemId);
      await removeCachedImage(itemId).catch(() => undefined);
      setCachedImages((previous) => {
        const next = { ...previous };
        delete next[itemId];
        return next;
      });
      setItems((previous) => previous.filter((item) => item.id !== itemId));
      await refreshDashboard({ suppressError: true });
      void message.success("内容已删除。");
    } catch (error) {
      const messageText =
        error instanceof ApiError ? error.message : "删除失败。";
      void message.error(messageText);
    }
  };

  const handleLogout = async () => {
    if (session.token) {
      try {
        await logout(session.token);
      } catch {
        // Ignore logout errors; local state should still be cleared.
      }
    }

    clearSessionState();
    setSession(initialSessionState);
    setItems([]);
    setRoute("login");
    setTextDraft("");
    loginForm.resetFields();
    void message.success("已退出登录。");
  };

  const handlePickFile = () => {
    fileInputRef.current?.click();
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      await uploadFile(file);
    }
  };

  const renderEmptyTimeline = () => (
    <div className="desktop-empty-state">
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={null}
      />
      <Title level={4} className="desktop-empty-title">
        这里还没有内容
      </Title>
      <Paragraph className="desktop-muted desktop-empty-copy">
        这个软件可以帮你在不同设备之间临时传文字和小文件，并且把历史记录保留下来，省得反复翻聊天记录或 AirDrop 失败后重新找文件。
      </Paragraph>
      <Paragraph className="desktop-muted desktop-empty-copy">
        你可以直接在左侧输入文字发送，也可以把小文件拖到输入区域，或者点击下方按钮选择文件上传。另一台登录同一账号的设备刷新后就能看到。
      </Paragraph>
    </div>
  );

  const copyTimelineText = async (content: string | undefined) => {
    if (!content) return;

    try {
      await navigator.clipboard.writeText(content);
      void message.success("已复制到剪贴板。");
    } catch {
      void message.error("复制失败。");
    }
  };

  const isImageItem = (item: TimelineItem) =>
    item.kind === "file" && !!item.file?.mimeType?.startsWith("image/");

  const handleShowImage = async (item: TimelineItem) => {
    if (!session.token || item.kind !== "file" || !item.file || !isImageItem(item)) return;

    setLoadingImageIds((previous) => ({ ...previous, [item.id]: true }));

    try {
      const response = await getFileDownloadUrl(session.token, item.id);
      const downloadUrl = new URL(response.data.downloadUrl, API_ORIGIN).toString();
      const cachedRecord = await cacheImageRecord({
        itemId: item.id,
        downloadUrl,
        token: session.token,
        fileName: item.file.originalName,
        mimeType: item.file.mimeType,
        timeoutMs: 30_000,
      });

      setCachedImages((previous) => ({
        ...previous,
        [item.id]: cachedRecord,
      }));
      void message.success("图片已缓存并显示。");
    } catch (error) {
      const messageText = getErrorMessage(error, "显示图片失败。");
      void message.error(messageText);
    } finally {
      setLoadingImageIds((previous) => {
        const next = { ...previous };
        delete next[item.id];
        return next;
      });
    }
  };

  if (loadingSession) {
    return (
      <Layout className="desktop-app-shell">
        <Content className="desktop-content desktop-loading-shell">
          <Spin size="large" />
        </Content>
      </Layout>
    );
  }

  if (route === "login") {
    return (
      <Layout className="desktop-app-shell">
        <Content className="desktop-content">
          <div className="desktop-container">
            <Row gutter={[24, 24]} align="stretch">
              <Col xs={24} lg={13}>
                <Card className="desktop-card desktop-hero-card">
                  <Space direction="vertical" size={18} style={{ width: "100%" }}>
                    <Tag className="desktop-tag">VercelSend Desktop</Tag>
                    <div>
                      <Title level={2} className="desktop-title">
                        Sign in
                      </Title>
                      <Paragraph className="desktop-muted">
                        Desktop-first workflow, local download history, and device naming start here.
                      </Paragraph>
                    </div>
                    <Paragraph className="desktop-muted">
                      The real client will keep session tokens locally, poll every 5 seconds, and cache downloaded files in SQLite.
                    </Paragraph>
                    <Paragraph className="desktop-muted">
                      This shell is already shaped around that workflow, even before the live APIs are fully wired.
                    </Paragraph>
                  </Space>
                </Card>
              </Col>
              <Col xs={24} lg={11}>
                <Card className="desktop-card">
                  <Space direction="vertical" size={18} style={{ width: "100%" }}>
                    <div>
                      <Title level={3} className="desktop-title">
                        Login
                      </Title>
                      <Paragraph className="desktop-muted">
                        Email is used only for account identity. Phase one does not verify mailbox ownership.
                      </Paragraph>
                      <Paragraph className="desktop-muted">
                        Current device: <Text strong>{effectiveDeviceName}</Text>
                      </Paragraph>
                    </div>

                    <Form form={loginForm} layout="vertical" className="desktop-form" autoComplete="off">
                      <Form.Item
                        label="Email"
                        name="email"
                        rules={[
                          { required: true, message: "请输入邮箱。" },
                          { type: "email", message: "邮箱格式不正确。" },
                        ]}
                      >
                        <Input size="large" placeholder="you@example.com" />
                      </Form.Item>
                      <Form.Item
                        label="Password"
                        name="password"
                        rules={[
                          { required: true, message: "请输入密码。" },
                          { min: 8, message: "密码至少 8 位。" },
                        ]}
                      >
                        <Input.Password size="large" placeholder="••••••••" />
                      </Form.Item>
                      <Space size={12}>
                        <Button type="primary" size="large" loading={authLoading} onClick={() => void submitAuth("login")}>
                          Login
                        </Button>
                        <Button size="large" loading={authLoading} onClick={() => void submitAuth("register")}>
                          Register
                        </Button>
                      </Space>
                    </Form>
                  </Space>
                </Card>
              </Col>
            </Row>
          </div>
        </Content>
      </Layout>
    );
  }

  if (route === "settings") {
    return (
      <Layout className="desktop-app-shell">
        <Content className="desktop-content">
          <div className="desktop-container">
            <div className="desktop-header-row">
              <div>
                <Tag className="desktop-tag">Settings</Tag>
                <Title level={2} className="desktop-page-title">
                  Device and quota
                </Title>
              </div>
              <Button size="large" onClick={() => setRoute("home")}>
                Back
              </Button>
            </div>

            <Row gutter={[24, 24]}>
              <Col xs={24} lg={12}>
                <Card className="desktop-card" title="Current device">
                  <Paragraph className="desktop-muted">
                    Editable device name will be wired later. Current session is already tagged with this device snapshot.
                  </Paragraph>
                  <Form layout="vertical" className="desktop-space-top">
                    <Form.Item label="Device name">
                      <Input size="large" value={effectiveDeviceName} readOnly />
                    </Form.Item>
                  </Form>
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card className="desktop-card" title="Effective quota">
                  <Paragraph className="desktop-muted">
                    These values are driven by the merged default policy and any per-user overrides.
                  </Paragraph>
                  <List
                    className="desktop-space-top"
                    dataSource={[
                      ["Text quota", formatBytes(quota.maxTotalTextBytes)],
                      ["File quota", formatBytes(quota.maxTotalFileBytes)],
                      ["Text used", formatBytes(quota.textBytesUsed)],
                      ["File used", formatBytes(quota.fileBytesUsed)],
                      ["Single file", `${quota.maxFileSizeMb} MB`],
                      ["File retention", `${quota.fileRetentionDays} days`],
                    ]}
                    renderItem={(item) => (
                      <List.Item>
                        <Text type="secondary">{item[0]}</Text>
                        <Text>{item[1]}</Text>
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
            </Row>
          </div>
        </Content>
      </Layout>
    );
  }

  return (
    <Layout className="desktop-app-shell">
      <Content className="desktop-content">
        <div className="desktop-container">
          <div className="desktop-header-row">
            <div>
              <Tag className="desktop-tag">Home</Tag>
              <Title level={2} className="desktop-page-title">
                Timeline
              </Title>
              <Paragraph className="desktop-muted">
                Signed in as {session.email}. A unified stream for text and small files, tagged with the uploading device.
              </Paragraph>
            </div>
            <Space size={12} wrap>
              <Button size="large" icon={<SettingOutlined />} onClick={() => setRoute("settings")}>
                Settings
              </Button>
              <Button size="large" icon={<LogoutOutlined />} onClick={() => void handleLogout()}>
                Logout
              </Button>
              <Button
                size="large"
                type="primary"
                icon={<ReloadOutlined spin={refreshing} />}
                onClick={() => void refreshDashboard({ showIndicator: true })}
              >
                Refresh
              </Button>
            </Space>
          </div>

          <Row gutter={[24, 24]}>
            <Col xs={24} lg={8}>
              <Card className="desktop-card" title="Compose">
                <Paragraph className="desktop-muted">
                  在这里可以直接发送文字，也可以拖拽或选择文件上传。超过 1MB 的文字建议先保存成 <Text code>.txt</Text> 再发送。
                </Paragraph>
                <Form layout="vertical" className="desktop-space-top">
                  <Form.Item label="Content">
                    <div
                      className={`desktop-compose-dropzone ${dragActive ? "desktop-compose-dropzone-active" : ""}`}
                      onDragEnter={(event) => {
                        event.preventDefault();
                        setDragActive(true);
                      }}
                      onDragOver={(event) => {
                        event.preventDefault();
                        setDragActive(true);
                      }}
                      onDragLeave={(event) => {
                        event.preventDefault();
                        setDragActive(false);
                      }}
                      onDrop={(event) => void handleDrop(event)}
                    >
                      <Input.TextArea
                        placeholder="在这里输入短文本，或把小文件直接拖到这个区域。也可以点击下方按钮选择文件上传。"
                        rows={8}
                        value={textDraft}
                        onChange={(event) => setTextDraft(event.target.value)}
                      />
                    </div>
                  </Form.Item>
                  <Space size={12} wrap>
                    <Button type="primary" icon={<InboxOutlined />} loading={textSending} onClick={() => void submitText()}>
                      Send
                    </Button>
                    <input ref={fileInputRef} type="file" onChange={handleFileUpload} hidden />
                    <Button icon={<FileAddOutlined />} loading={uploadingFile} onClick={handlePickFile}>
                      Choose File
                    </Button>
                  </Space>
                </Form>
              </Card>
            </Col>

            <Col xs={24} lg={16}>
              <Card className="desktop-card" title="Recent items">
                <div className="desktop-timeline-toolbar">
                  <Paragraph className="desktop-muted desktop-toolbar-copy">
                    这里会显示当前账号的时间流内容，你可以按类型筛选查看文字或文件。
                  </Paragraph>
                  <Segmented<FilterMode>
                    value={filter}
                    options={[
                      { label: "All", value: "all" },
                      { label: "Text", value: "text" },
                      { label: "File", value: "file" },
                    ]}
                    onChange={(value) => setFilter(value)}
                  />
                </div>
                <List
                  className="desktop-space-top"
                  locale={{ emptyText: renderEmptyTimeline() }}
                  dataSource={items}
                  renderItem={(item) => (
                    <List.Item
                      className="desktop-list-item"
                      actions={[
                        item.kind === "file" ? (
                          isImageItem(item) ? (
                            cachedImages[item.id] ? null : (
                              <Button
                                key="show-image"
                                icon={<EyeOutlined />}
                                loading={!!loadingImageIds[item.id]}
                                onClick={() => void handleShowImage(item)}
                              >
                                显示图片
                              </Button>
                            )
                          ) : (
                            <Button key="download" icon={<DownloadOutlined />} disabled>
                              Download
                            </Button>
                          )
                        ) : null,
                        <Button key="delete" danger onClick={() => void handleDelete(item.id)}>
                          Delete
                        </Button>,
                      ].filter(Boolean)}
                    >
                      <Space direction="vertical" size={10} style={{ width: "100%" }}>
                        <Space size={[8, 8]} wrap>
                          <Tag color={item.kind === "text" ? "gold" : "blue"}>{item.kind.toUpperCase()}</Tag>
                          <Tag icon={<UserOutlined />}>{item.deviceName}</Tag>
                        </Space>
                        <div>
                          <Text strong className="desktop-list-title">
                            {item.kind === "file" ? item.file?.originalName : "Text note"}
                          </Text>
                          {item.kind === "file" ? (
                            <>
                              <Paragraph className="desktop-muted" style={{ marginTop: 8, marginBottom: 0 }}>
                                {`${formatBytes(item.file?.sizeBytes ?? 0)} · ${item.file?.mimeType ?? "application/octet-stream"}`}
                              </Paragraph>
                              {isImageItem(item) && cachedImages[item.id] ? (
                                <div className="desktop-image-preview">
                                  <img
                                    src={cachedImages[item.id].assetUrl}
                                    alt={item.file?.originalName}
                                    className="desktop-image-preview-image"
                                  />
                                </div>
                              ) : null}
                            </>
                          ) : (
                            <div
                              className="desktop-text-copy-row"
                              role="button"
                              tabIndex={0}
                              onClick={() => void copyTimelineText(item.contentPreview)}
                              onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                  event.preventDefault();
                                  void copyTimelineText(item.contentPreview);
                                }
                              }}
                            >
                              <Paragraph className="desktop-muted desktop-copyable-text">
                                {item.contentPreview}
                              </Paragraph>
                              <Tooltip title="复制内容">
                                <Button
                                  type="text"
                                  size="small"
                                  className="desktop-copy-button"
                                  icon={<CopyOutlined />}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    void copyTimelineText(item.contentPreview);
                                  }}
                                />
                              </Tooltip>
                            </div>
                          )}
                          <Text type="secondary">{formatDate(item.createdAt)}</Text>
                        </div>
                      </Space>
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
          </Row>
        </div>
      </Content>
    </Layout>
  );
}

export function App() {
  return (
    <AntdApp>
      <DesktopApp />
    </AntdApp>
  );
}
