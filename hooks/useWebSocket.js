import { useState, useEffect, useRef } from 'react';

// WebSocket配置
export const WS_CONFIG = {
  baseUrl: 'ws://112.28.56.235:1880',
  sitesPath: '/ws/sites',  // 站点列表WebSocket路径
  siteDetailPath: '/ws/site', // 站点详情WebSocket路径
  heartbeatInterval: 30000, // 30秒发送一次心跳
  reconnectInterval: 3000, // 重连间隔时间（毫秒）
  maxReconnectAttempts: 10 // 最大重连次数
};

const useWebSocket = (path, siteId = null, onMessage = null) => {
  const [isConnected, setIsConnected] = useState(false);
  const websocketRef = useRef(null);
  const heartbeatTimerRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const manualDisconnectRef = useRef(false);

  const getWebSocketUrl = () => {
    if (path === WS_CONFIG.sitesPath) {
      return `${WS_CONFIG.baseUrl}${path}`;
    } else if (path === WS_CONFIG.siteDetailPath && siteId) {
      return `${WS_CONFIG.baseUrl}${path}/${siteId}`;
    }
    throw new Error('无效的WebSocket路径或缺少站点ID');
  };

  const cleanup = () => {
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }
    setIsConnected(false);
  };

  const startHeartbeat = () => {
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
    }
    heartbeatTimerRef.current = setInterval(() => {
      if (websocketRef.current?.readyState === WebSocket.OPEN) {
        try {
          websocketRef.current.send(JSON.stringify({ type: 'heartbeat' }));
        } catch (error) {
          console.error('发送心跳消息失败:', error);
          cleanup();
        }
      } else if (websocketRef.current?.readyState === WebSocket.CLOSED) {
        cleanup();
      }
    }, WS_CONFIG.heartbeatInterval);
  };

  const connectWebSocket = () => {
    if (websocketRef.current?.readyState === WebSocket.CONNECTING) {
      console.log('WebSocket正在连接中，等待连接完成...');
      return;
    }

    cleanup();

    try {
      const wsUrl = getWebSocketUrl();
      websocketRef.current = new WebSocket(wsUrl);

      websocketRef.current.onopen = () => {
        console.log('WebSocket连接已建立');
        setIsConnected(true);
        reconnectAttemptsRef.current = 0; // 重置重连次数
        startHeartbeat();
      };

      websocketRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'heartbeat') {
            return;
          }
          if (onMessage) {
            onMessage(data);
          } else {
            console.warn('未设置消息处理函数');
          }
        } catch (error) {
          console.error('解析WebSocket消息失败:', error, '原始数据:', event.data);
        }
      };

      websocketRef.current.onerror = (error) => {
        console.error('WebSocket错误:', error);
        cleanup();
      };

      websocketRef.current.onclose = (event) => {
        console.log('WebSocket连接已关闭，关闭码:', event.code);
        setIsConnected(false);
        
        // 只有在非手动断开且连接非正常关闭的情况下才尝试重连
        if (!manualDisconnectRef.current && 
            event.code !== 1000 && // 正常关闭
            event.code !== 1001 && // 终端离开
            reconnectAttemptsRef.current < WS_CONFIG.maxReconnectAttempts) {
          console.log(`尝试重新连接... (${reconnectAttemptsRef.current + 1}/${WS_CONFIG.maxReconnectAttempts})`);
          reconnectTimerRef.current = setTimeout(() => {
            if (websocketRef.current?.readyState === WebSocket.CLOSED) {
              reconnectAttemptsRef.current += 1;
              connectWebSocket();
            }
          }, WS_CONFIG.reconnectInterval);
        } else if (manualDisconnectRef.current) {
          console.log('WebSocket已手动断开，不进行重连');
          cleanup();
        } else {
          console.log('达到最大重连次数或连接正常关闭，停止重连');
          cleanup();
        }
      };
    } catch (error) {
      console.error('创建WebSocket连接失败:', error);
      cleanup();
    }
  };

  const sendMessage = (message) => {
    if (websocketRef.current?.readyState === WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify(message));
    } else {
      console.log('WebSocket未连接，无法发送消息');
    }
  };

  useEffect(() => {
    manualDisconnectRef.current = false;
    connectWebSocket();
    return () => {
      manualDisconnectRef.current = true;
      cleanup();
    };
  }, []);

  return {
    isConnected,
    sendMessage
  };
};

export default useWebSocket;