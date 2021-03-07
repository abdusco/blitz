FROM node:15-buster-slim as ui-builder

WORKDIR /app
COPY ClientApp .
RUN rm -rf node_modules
RUN yarn && yarn build 

FROM mcr.microsoft.com/dotnet/sdk:5.0 as builder

WORKDIR /app

COPY *.csproj .
RUN dotnet restore

COPY . ./
RUN dotnet publish -c Release -o out

FROM mcr.microsoft.com/dotnet/aspnet:5.0 as app

WORKDIR /app
COPY --from=ui-builder /app/dist ./wwwroot
COPY --from=builder /app/out .
ENTRYPOINT ["dotnet", "Blitz.Web.dll"]