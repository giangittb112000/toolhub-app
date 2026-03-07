export interface GetVersionResponse {
  version: string;
  platform: NodeJS.Platform;
}

export interface CheckUpdateResponse {
  currentVersion: string;
  latestVersion: string;
  needsUpdate: boolean;
  releaseUrl: string;
  releaseNotes: string;
}

export interface SystemStats {
  cpu: {
    average: number;
    cores: Array<{
      model: string;
      speed: number;
      percentage: number;
    }>;
  };
  memory: {
    total: number;
    used: number;
    percentage: number;
  };
  loadavg: [number, number, number];
  uptime: number;
  appUptime: number;
  platform: string;
  arch: string;
  timestamp: string;
}

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface MockEndpoint {
  id: string;
  method: HttpMethod;
  path: string;
  statusCode: number;
  responseBody: string;
  contentType: string;
  delay: number;
  description: string;
  createdAt: string;
  hits: number;
}

export interface CreateEndpointDto {
  method: HttpMethod;
  path: string;
  statusCode?: number;
  responseBody: string;
  contentType?: string;
  delay?: number;
  description?: string;
}

export interface UpdateEndpointDto extends Partial<CreateEndpointDto> {
  id: string;
}
